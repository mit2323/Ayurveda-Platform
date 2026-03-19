"""Payments API routes — /api/v1/payments/*"""
from fastapi import APIRouter, Request

from app.core.dependencies import CurrentUser, DBSession, RedisClient
from app.schemas.order import CreateRazorpayOrderResponse, PaymentVerifyRequest
from app.services.payment import PaymentService
from app.utils.cache import CacheService

router = APIRouter(prefix="/payments", tags=["Payments"])


def _svc(db: DBSession, redis: RedisClient) -> PaymentService:
    return PaymentService(db, CacheService(redis))


@router.post(
    "/create-order/{order_id}",
    response_model=CreateRazorpayOrderResponse,
    summary="Create Razorpay order for checkout",
)
async def create_razorpay_order(
    order_id: int,
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient,
):
    return await _svc(db, redis).create_razorpay_order(order_id, current_user.id)


@router.post("/verify", summary="Verify Razorpay payment after checkout")
async def verify_payment(
    data: PaymentVerifyRequest,
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient,
):
    return await _svc(db, redis).verify_payment(data)


@router.post("/webhook", include_in_schema=False)
async def razorpay_webhook(request: Request, db: DBSession, redis: RedisClient):
    """Razorpay sends events here. No auth — verified by HMAC signature."""
    return await _svc(db, redis).handle_webhook(request)