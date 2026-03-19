"""Admin API routes — /api/v1/admin/* (all require admin role)"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.core.dependencies import AdminUser, DBSession, Pagination
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.review import Review
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Dashboard analytics ───────────────────────────────────────────────────────
@router.get("/analytics/summary", summary="Revenue + order + user summary")
async def analytics_summary(db: DBSession, _admin: AdminUser):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total revenue (all confirmed+ orders)
    total_rev = await db.execute(
        select(func.sum(Order.total_amount)).where(
            Order.status.notin_([OrderStatus.PENDING, OrderStatus.CANCELLED])
        )
    )
    # Revenue this month
    month_rev = await db.execute(
        select(func.sum(Order.total_amount)).where(
            Order.status.notin_([OrderStatus.PENDING, OrderStatus.CANCELLED]),
            Order.created_at >= month_start,
        )
    )
    # Order counts
    total_orders = await db.execute(select(func.count()).select_from(Order))
    pending_orders = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.PENDING)
    )
    # User count
    total_users = await db.execute(select(func.count()).select_from(User))
    # Product count
    total_products = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active == True)
    )
    # Low stock products
    low_stock = await db.execute(
        select(func.count()).select_from(Product).where(
            Product.stock <= Product.low_stock_threshold,
            Product.is_active == True,
        )
    )

    return {
        "total_revenue": float(total_rev.scalar_one() or 0),
        "monthly_revenue": float(month_rev.scalar_one() or 0),
        "total_orders": total_orders.scalar_one(),
        "pending_orders": pending_orders.scalar_one(),
        "total_users": total_users.scalar_one(),
        "total_products": total_products.scalar_one(),
        "low_stock_products": low_stock.scalar_one(),
    }


@router.get("/analytics/revenue-chart", summary="Daily revenue for last 30 days")
async def revenue_chart(db: DBSession, _admin: AdminUser):
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(
            func.date_trunc("day", Order.created_at).label("day"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .where(
            Order.created_at >= thirty_days_ago,
            Order.status.notin_([OrderStatus.PENDING, OrderStatus.CANCELLED]),
        )
        .group_by("day")
        .order_by("day")
    )
    return [
        {"date": str(row.day.date()), "revenue": float(row.revenue), "orders": row.orders}
        for row in result.all()
    ]


@router.get("/analytics/top-products", summary="Top selling products")
async def top_products(db: DBSession, _admin: AdminUser, limit: int = 10):
    from app.models.order import OrderItem
    result = await db.execute(
        select(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.total_price).label("total_revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    return [
        {
            "id": row.id,
            "name": row.name,
            "sku": row.sku,
            "total_sold": row.total_sold,
            "total_revenue": float(row.total_revenue),
        }
        for row in result.all()
    ]


# ── Order management ──────────────────────────────────────────────────────────
@router.get("/orders", summary="List all orders")
async def list_all_orders(
    db: DBSession,
    _admin: AdminUser,
    pagination: Pagination,
    status: OrderStatus | None = None,
):
    q = select(Order).order_by(Order.created_at.desc())
    if status:
        q = q.where(Order.status == status)
    result = await db.execute(q.offset(pagination.offset).limit(pagination.page_size))
    return result.scalars().all()


@router.patch("/orders/{order_id}/status", summary="Update order status")
async def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    tracking_number: str | None = None,
    db: DBSession = None,
    _admin: AdminUser = None,
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = new_status
    if tracking_number:
        order.tracking_number = tracking_number
    await db.commit()
    return {"message": f"Order status updated to {new_status}"}


# ── User management ───────────────────────────────────────────────────────────
@router.get("/users", summary="List all users")
async def list_users(db: DBSession, _admin: AdminUser, pagination: Pagination):
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
    )
    return result.scalars().all()


@router.patch("/users/{user_id}/deactivate", summary="Deactivate a user")
async def deactivate_user(user_id: int, db: DBSession, _admin: AdminUser):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = False
    await db.commit()
    return {"message": "User deactivated"}


# ── Review moderation ─────────────────────────────────────────────────────────
@router.get("/reviews/pending", summary="List reviews pending approval")
async def pending_reviews(db: DBSession, _admin: AdminUser, pagination: Pagination):
    result = await db.execute(
        select(Review)
        .where(Review.is_approved == False)
        .order_by(Review.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
    )
    return result.scalars().all()


# ── Inventory ─────────────────────────────────────────────────────────────────
@router.get("/inventory/low-stock", summary="Products below low-stock threshold")
async def low_stock_products(db: DBSession, _admin: AdminUser):
    result = await db.execute(
        select(Product).where(
            Product.stock <= Product.low_stock_threshold,
            Product.is_active == True,
        ).order_by(Product.stock.asc())
    )
    return result.scalars().all()


@router.patch("/inventory/{product_id}/restock", summary="Update product stock")
async def restock_product(
    product_id: int, quantity: int, db: DBSession, _admin: AdminUser
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    product.stock += quantity
    await db.commit()
    return {"message": f"Stock updated. New stock: {product.stock}"}