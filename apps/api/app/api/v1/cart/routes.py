"""Cart API routes — /api/v1/cart/* (Redis-backed, no DB)"""
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUser, DBSession, RedisClient
from app.repositories.product import ProductRepository
from app.schemas.order import CartItemRequest, CartSummary
from app.utils.cache import CacheService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=CartSummary, summary="Get current cart")
async def get_cart(current_user: CurrentUser, redis: RedisClient, db: DBSession):
    cache = CacheService(redis)
    cart_data = await cache.get_cart(current_user.id)
    return await _build_cart_summary(cart_data, db)


@router.post("/items", status_code=status.HTTP_200_OK, summary="Add or update item in cart")
async def add_to_cart(
    item: CartItemRequest,
    current_user: CurrentUser,
    redis: RedisClient,
    db: DBSession,
):
    # Validate product exists and has stock
    product = await ProductRepository(db).get_by_id(item.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < item.quantity:
        raise HTTPException(
            status_code=409,
            detail=f"Only {product.stock} units in stock",
        )

    cache = CacheService(redis)
    cart = await cache.get_cart(current_user.id)
    key = str(item.product_id)

    cart["items"][key] = {
        "product_id": item.product_id,
        "quantity": item.quantity,
        "name": product.name,
        "price": str(product.effective_price),
        "image_url": product.primary_image_url,
        "slug": product.slug,
    }

    await cache.set_cart(current_user.id, cart)
    return await _build_cart_summary(cart, db)


@router.delete("/items/{product_id}", summary="Remove item from cart")
async def remove_from_cart(
    product_id: int,
    current_user: CurrentUser,
    redis: RedisClient,
    db: DBSession,
):
    cache = CacheService(redis)
    cart = await cache.get_cart(current_user.id)
    cart["items"].pop(str(product_id), None)
    await cache.set_cart(current_user.id, cart)
    return await _build_cart_summary(cart, db)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, summary="Clear cart")
async def clear_cart(current_user: CurrentUser, redis: RedisClient):
    cache = CacheService(redis)
    await cache.clear_cart(current_user.id)


async def _build_cart_summary(cart_data: dict, db: DBSession) -> CartSummary:
    items = list(cart_data.get("items", {}).values())
    subtotal = sum(Decimal(i["price"]) * i["quantity"] for i in items)
    item_count = sum(i["quantity"] for i in items)
    return CartSummary(items=items, subtotal=subtotal, item_count=item_count)