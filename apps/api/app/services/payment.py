"""Payment service — Razorpay order creation and webhook verification."""
import hashlib
import hmac
from decimal import Decimal

import razorpay
from fastapi import HTTPException, Request, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.order import CreateRazorpayOrderResponse, PaymentVerifyRequest
from app.utils.cache import CacheService

rzp_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


class PaymentService:
    def __init__(self, db: AsyncSession, cache: CacheService) -> None:
        self.db = db
        self.cache = cache

    async def create_razorpay_order(
        self, order_id: int, user_id: int
    ) -> CreateRazorpayOrderResponse:
        """Create a Razorpay order for a pending internal order."""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == user_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status != OrderStatus.PENDING:
            raise HTTPException(status_code=400, detail="Order is not in pending state")

        # Amount in paise (INR × 100)
        amount_paise = int(order.total_amount * 100)

        try:
            rzp_order = rzp_client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order.order_number,
                "notes": {
                    "internal_order_id": str(order.id),
                    "user_id": str(user_id),
                },
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            raise HTTPException(status_code=502, detail="Payment gateway error")

        # Create pending Payment record
        payment = Payment(
            order_id=order.id,
            razorpay_order_id=rzp_order["id"],
            amount=order.total_amount,
            currency="INR",
            status=PaymentStatus.PENDING,
        )
        self.db.add(payment)
        await self.db.commit()

        return CreateRazorpayOrderResponse(
            razorpay_order_id=rzp_order["id"],
            amount=amount_paise,
            currency="INR",
            order_id=order.id,
            key_id=settings.RAZORPAY_KEY_ID,
        )

    async def verify_payment(self, data: PaymentVerifyRequest) -> dict:
        """
        Verify Razorpay payment signature and mark order as confirmed.
        This is called by the frontend after the Razorpay checkout popup.
        """
        # 1. Verify HMAC signature
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, data.razorpay_signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed",
            )

        # 2. Update Payment record
        result = await self.db.execute(
            select(Payment).where(
                Payment.razorpay_order_id == data.razorpay_order_id
            )
        )
        payment = result.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found")

        payment.razorpay_payment_id = data.razorpay_payment_id
        payment.razorpay_signature = data.razorpay_signature
        payment.status = PaymentStatus.CAPTURED

        # 3. Confirm the order
        order_result = await self.db.execute(
            select(Order).where(Order.id == data.order_id)
        )
        order = order_result.scalar_one_or_none()
        if order:
            order.status = OrderStatus.CONFIRMED

        await self.db.commit()

        # 4. Clear cart
        if order:
            await self.cache.clear_cart(order.user_id)

        # 5. Trigger order confirmation email (Celery)
        # send_order_confirmation_email.delay(order.id)

        logger.info(f"Payment captured: {data.razorpay_payment_id} for order {data.order_id}")
        return {"message": "Payment verified successfully", "order_id": data.order_id}

    async def handle_webhook(self, request: Request) -> dict:
        """
        Handle Razorpay webhook events (payment.captured, refund.processed, etc.)
        Verify webhook signature before processing.
        """
        body = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")

        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        import json
        payload = json.loads(body)
        event = payload.get("event")
        logger.info(f"Razorpay webhook: {event}")

        if event == "payment.captured":
            payment_data = payload["payload"]["payment"]["entity"]
            await self._handle_payment_captured(payment_data)
        elif event == "refund.processed":
            refund_data = payload["payload"]["refund"]["entity"]
            await self._handle_refund_processed(refund_data)

        return {"status": "ok"}

    async def _handle_payment_captured(self, payment_data: dict) -> None:
        rzp_order_id = payment_data.get("order_id")
        result = await self.db.execute(
            select(Payment).where(Payment.razorpay_order_id == rzp_order_id)
        )
        payment = result.scalar_one_or_none()
        if payment and payment.status != PaymentStatus.CAPTURED:
            payment.status = PaymentStatus.CAPTURED
            payment.payment_method = payment_data.get("method")
            order_result = await self.db.execute(
                select(Order).where(Order.id == payment.order_id)
            )
            order = order_result.scalar_one_or_none()
            if order:
                order.status = OrderStatus.CONFIRMED
            await self.db.commit()

    async def _handle_refund_processed(self, refund_data: dict) -> None:
        rzp_payment_id = refund_data.get("payment_id")
        result = await self.db.execute(
            select(Payment).where(Payment.razorpay_payment_id == rzp_payment_id)
        )
        payment = result.scalar_one_or_none()
        if payment:
            payment.status = PaymentStatus.REFUNDED
            order_result = await self.db.execute(
                select(Order).where(Order.id == payment.order_id)
            )
            order = order_result.scalar_one_or_none()
            if order:
                order.status = OrderStatus.REFUNDED
            await self.db.commit()