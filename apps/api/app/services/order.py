"""Order service — checkout flow, order management."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import Address
from app.models.coupon import Coupon, DiscountType
from app.models.order import Order, OrderItem, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.repositories.product import ProductRepository
from app.schemas.order import CheckoutRequest, OrderOut
from app.utils.cache import CacheService


def _generate_order_number() -> str:
    """Generate a human-readable unique order number."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_id = uuid.uuid4().hex[:6].upper()
    return f"AYU-{timestamp}-{short_id}"


class OrderService:
    def __init__(self, db: AsyncSession, cache: CacheService) -> None:
        self.db = db
        self.cache = cache

    async def create_order_from_cart(
        self, user_id: int, data: CheckoutRequest
    ) -> Order:
        # 1. Get cart from Redis
        cart = await self.cache.get_cart(user_id)
        items = cart.get("items", {})
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        # 2. Validate shipping address belongs to user
        address_result = await self.db.execute(
            select(Address).where(
                Address.id == data.address_id,
                Address.user_id == user_id,
            )
        )
        address = address_result.scalar_one_or_none()
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")

        # 3. Validate stock + build order items atomically
        product_repo = ProductRepository(self.db)
        order_items = []
        subtotal = Decimal("0")

        for key, cart_item in items.items():
            product_id = cart_item["product_id"]
            quantity = cart_item["quantity"]
            product = await product_repo.get_by_id(product_id)

            if not product or not product.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Product '{cart_item['name']}' is no longer available",
                )
            if product.stock < quantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Only {product.stock} units of '{product.name}' left in stock",
                )

            unit_price = product.effective_price
            line_total = unit_price * quantity
            subtotal += line_total

            order_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": line_total,
                "product_snapshot": {
                    "name": product.name,
                    "sku": product.sku,
                    "image_url": product.primary_image_url,
                    "slug": product.slug,
                },
            })

        # 4. Apply coupon
        discount_amount = Decimal("0")
        coupon = None
        if data.coupon_code:
            coupon = await self._validate_coupon(data.coupon_code, subtotal)
            discount_amount = self._calc_discount(coupon, subtotal)

        # 5. Calculate totals
        shipping_amount = Decimal("0") if subtotal >= 500 else Decimal("50")
        tax_amount = (subtotal - discount_amount) * Decimal("0.18")  # 18% GST
        total_amount = subtotal - discount_amount + shipping_amount + tax_amount

        # 6. Create order record
        order = Order(
            order_number=_generate_order_number(),
            user_id=user_id,
            status=OrderStatus.PENDING,
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_amount=shipping_amount,
            tax_amount=tax_amount.quantize(Decimal("0.01")),
            total_amount=total_amount.quantize(Decimal("0.01")),
            coupon_code=data.coupon_code,
            shipping_address={
                "full_name": address.full_name,
                "phone": address.phone,
                "line1": address.line1,
                "line2": address.line2,
                "city": address.city,
                "state": address.state,
                "pincode": address.pincode,
                "country": address.country,
            },
            notes=data.notes,
        )
        self.db.add(order)
        await self.db.flush()

        # 7. Create order items + decrement stock
        for item_data in order_items:
            order_item = OrderItem(order_id=order.id, **item_data)
            self.db.add(order_item)
            await product_repo.decrement_stock(
                item_data["product_id"], item_data["quantity"]
            )

        # 8. Increment coupon usage
        if coupon:
            coupon.used_count += 1

        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get_user_orders(
        self, user_id: int, offset: int = 0, limit: int = 20
    ) -> list[Order]:
        result = await self.db.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_order_by_id(self, order_id: int, user_id: int) -> Order:
        result = await self.db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == user_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    async def cancel_order(self, order_id: int, user_id: int) -> Order:
        order = await self.get_order_by_id(order_id, user_id)
        if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel order in '{order.status}' status",
            )
        order.status = OrderStatus.CANCELLED
        # Restore stock
        for item in order.items:
            if item.product_id:
                product = await ProductRepository(self.db).get_by_id(item.product_id)
                if product:
                    product.stock += item.quantity
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def _validate_coupon(self, code: str, order_amount: Decimal) -> Coupon:
        result = await self.db.execute(
            select(Coupon).where(Coupon.code == code.upper(), Coupon.is_active == True)
        )
        coupon = result.scalar_one_or_none()
        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid coupon code")
        if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon has expired")
        if coupon.max_uses and coupon.used_count >= coupon.max_uses:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        if order_amount < coupon.min_order_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount ₹{coupon.min_order_amount} required",
            )
        return coupon

    def _calc_discount(self, coupon: Coupon, subtotal: Decimal) -> Decimal:
        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount = subtotal * (coupon.discount_value / 100)
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)
            return discount.quantize(Decimal("0.01"))
        return min(coupon.discount_value, subtotal)