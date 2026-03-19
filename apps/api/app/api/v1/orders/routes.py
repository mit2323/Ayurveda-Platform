"""Orders API routes — /api/v1/orders/*"""
from fastapi import APIRouter, status

from app.core.dependencies import CurrentUser, DBSession, Pagination, RedisClient
from app.schemas.base import PaginatedResponse
from app.schemas.order import CheckoutRequest, OrderOut
from app.services.order import OrderService
from app.utils.cache import CacheService

router = APIRouter(prefix="/orders", tags=["Orders"])


def _svc(db: DBSession, redis: RedisClient) -> OrderService:
    return OrderService(db, CacheService(redis))


@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Place an order from cart",
)
async def create_order(
    data: CheckoutRequest,
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient,
):
    return await _svc(db, redis).create_order_from_cart(current_user.id, data)


@router.get("", response_model=PaginatedResponse[OrderOut], summary="List my orders")
async def list_orders(
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient,
    pagination: Pagination,
):
    svc = _svc(db, redis)
    orders = await svc.get_user_orders(
        current_user.id, offset=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.create(
        items=orders,
        total=len(orders),
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/{order_id}", response_model=OrderOut, summary="Get order details")
async def get_order(
    order_id: int,
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient,
):
    return await _svc(db, redis).get_order_by_id(order_id, current_user.id)


@router.post("/{order_id}/cancel", response_model=OrderOut, summary="Cancel an order")
async def cancel_order(
    order_id: int,
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient,
):
    return await _svc(db, redis).cancel_order(order_id, current_user.id)