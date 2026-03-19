"""Inventory Celery tasks — low stock checks and alerts."""
from loguru import logger
from app.tasks.celery_app import celery_app


@celery_app.task
def check_low_stock():
    """
    Periodic task: scan for products below low_stock_threshold
    and alert admins. Schedule with Celery Beat every 6 hours.
    """
    import asyncio
    from sqlalchemy import select
    from app.db.session import AsyncSessionLocal
    from app.models.product import Product

    async def _check():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Product).where(
                    Product.stock <= Product.low_stock_threshold,
                    Product.is_active == True,
                )
            )
            low_products = result.scalars().all()
            if low_products:
                logger.warning(
                    f"LOW STOCK ALERT: {len(low_products)} products below threshold: "
                    + ", ".join(f"{p.name} ({p.stock})" for p in low_products)
                )
                # TODO: send alert email to admins
            return len(low_products)

    return asyncio.run(_check())


@celery_app.task
def generate_daily_report():
    """
    Daily sales report task — schedule at midnight IST via Celery Beat.
    """
    logger.info("Generating daily sales report...")
    # TODO: aggregate yesterday's sales and email to admin