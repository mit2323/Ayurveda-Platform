"""Product service — product management business logic."""
import json
from typing import Any

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models.product import Product
from app.repositories.product import ProductRepository
from app.schemas.product import (
    ProductCreateRequest,
    ProductFilterParams,
    ProductUpdateRequest,
)
from app.utils.cache import CacheService
from app.utils.slug import generate_unique_slug


# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

PRODUCT_CACHE_PREFIX = "product:"
PRODUCT_LIST_CACHE_PREFIX = "products:list:"


class ProductService:
    def __init__(self, repo: ProductRepository, cache: CacheService) -> None:
        self.repo = repo
        self.cache = cache

    async def list_products(self, filters: ProductFilterParams, page: int, page_size: int):
        """List products with filters, caching the result."""
        cache_key = f"{PRODUCT_LIST_CACHE_PREFIX}{filters.model_dump_json()}:{page}:{page_size}"
        cached = await self.cache.get(cache_key)
        if cached:
            return json.loads(cached)

        offset = (page - 1) * page_size
        products, total = await self.repo.list_with_filters(filters, offset, page_size)
        result = {"products": [p.__dict__ for p in products], "total": total}
        # Cache for 2 minutes (product lists change frequently)
        await self.cache.set(cache_key, json.dumps(result, default=str), ttl=120)
        return products, total

    async def get_product_by_slug(self, slug: str) -> Product:
        cache_key = f"{PRODUCT_CACHE_PREFIX}{slug}"
        cached = await self.cache.get(cache_key)
        if cached:
            # Would deserialize in real impl; return from DB for correctness
            pass

        product = await self.repo.get_by_slug(slug)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    async def create_product(self, data: ProductCreateRequest) -> Product:
        # Check SKU uniqueness
        if await self.repo.get_by_sku(data.sku):
            raise HTTPException(status_code=409, detail=f"SKU '{data.sku}' already exists")

        slug = await generate_unique_slug(data.name, self.repo)

        product = await self.repo.create(
            **data.model_dump(exclude_none=True),
            slug=slug,
        )
        await self.repo.save()
        await self.cache.delete_pattern(f"{PRODUCT_LIST_CACHE_PREFIX}*")
        return product

    async def update_product(self, product_id: int, data: ProductUpdateRequest) -> Product:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        update_data = data.model_dump(exclude_none=True)
        product = await self.repo.update(product, **update_data)
        await self.repo.save()

        # Bust caches
        await self.cache.delete(f"{PRODUCT_CACHE_PREFIX}{product.slug}")
        await self.cache.delete_pattern(f"{PRODUCT_LIST_CACHE_PREFIX}*")
        return product

    async def delete_product(self, product_id: int) -> None:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Soft-delete: just deactivate
        await self.repo.update(product, is_active=False)
        await self.repo.save()
        await self.cache.delete(f"{PRODUCT_CACHE_PREFIX}{product.slug}")

    async def upload_product_image(
        self,
        product_id: int,
        file: UploadFile,
        is_primary: bool = False,
    ) -> dict[str, Any]:
        """Upload image to Cloudinary and create ProductImage record."""
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=422, detail="Only JPEG, PNG, and WebP allowed")

        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:  # 5 MB limit
            raise HTTPException(status_code=413, detail="Image must be under 5MB")

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=f"ayurveda/products/{product_id}",
            transformation=[
                {"width": 1200, "height": 1200, "crop": "limit", "quality": "auto:good"},
            ],
            format="webp",
        )

        # Create ProductImage record
        from app.models.product import ProductImage
        sort_order = len(product.images)
        image = ProductImage(
            product_id=product_id,
            url=result["secure_url"],
            cloudinary_public_id=result["public_id"],
            is_primary=is_primary or sort_order == 0,
            sort_order=sort_order,
        )
        self.repo.db.add(image)
        await self.repo.save()

        return {"url": result["secure_url"], "public_id": result["public_id"]}