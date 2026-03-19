"""Product repository — filtered queries and search."""
from decimal import Decimal
from typing import Sequence

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import DoshaType, Product, ProductImage
from app.repositories.base import BaseRepository
from app.schemas.product import ProductFilterParams


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Product, db)

    async def get_by_slug(self, slug: str) -> Product | None:
        result = await self.db.execute(
            select(Product)
            .where(Product.slug == slug, Product.is_active == True)
            .options(selectinload(Product.images), selectinload(Product.category))
        )
        return result.scalar_one_or_none()

    async def get_by_sku(self, sku: str) -> Product | None:
        result = await self.db.execute(select(Product).where(Product.sku == sku))
        return result.scalar_one_or_none()

    async def list_with_filters(
        self,
        filters: ProductFilterParams,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Product], int]:
        """Return (products, total_count) with all filters applied."""
        q = (
            select(Product)
            .where(Product.is_active == True)
            .options(selectinload(Product.images), selectinload(Product.category))
        )

        # Full-text search
        if filters.q:
            q = q.where(
                or_(
                    Product.name.ilike(f"%{filters.q}%"),
                    Product.description.ilike(f"%{filters.q}%"),
                    # Postgres tsvector search (preferred when search_vector is set)
                    # Product.search_vector.match(filters.q),
                )
            )

        if filters.category_id:
            q = q.where(Product.category_id == filters.category_id)

        if filters.dosha_type:
            q = q.where(Product.dosha_type == filters.dosha_type)

        if filters.min_price is not None:
            q = q.where(Product.price >= filters.min_price)

        if filters.max_price is not None:
            q = q.where(Product.price <= filters.max_price)

        if filters.in_stock:
            q = q.where(Product.stock > 0)

        if filters.is_featured is not None:
            q = q.where(Product.is_featured == filters.is_featured)

        # Count before pagination
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        # Sorting
        sort_col = {
            "price": Product.price,
            "name": Product.name,
            "created_at": Product.created_at,
        }.get(filters.sort_by, Product.created_at)

        if filters.sort_order == "asc":
            q = q.order_by(sort_col.asc())
        else:
            q = q.order_by(sort_col.desc())

        q = q.offset(offset).limit(limit)
        result = await self.db.execute(q)
        return result.scalars().all(), total

    async def get_featured(self, limit: int = 8) -> Sequence[Product]:
        result = await self.db.execute(
            select(Product)
            .where(Product.is_featured == True, Product.is_active == True)
            .options(selectinload(Product.images))
            .limit(limit)
        )
        return result.scalars().all()

    async def decrement_stock(self, product_id: int, quantity: int) -> bool:
        """Atomically decrement stock. Returns False if insufficient."""
        result = await self.db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.stock >= quantity,
            ).with_for_update()
        )
        product = result.scalar_one_or_none()
        if not product:
            return False
        product.stock -= quantity
        return True