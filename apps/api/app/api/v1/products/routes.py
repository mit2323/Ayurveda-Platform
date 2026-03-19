"""Products API routes — /api/v1/products/*"""
from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.dependencies import AdminUser, CurrentUser, DBSession, Pagination, RedisClient
from app.models.product import DoshaType
from app.repositories.product import ProductRepository
from app.schemas.base import PaginatedResponse
from app.schemas.product import (
    ProductCreateRequest,
    ProductDetail,
    ProductFilterParams,
    ProductListItem,
    ProductUpdateRequest,
)
from app.services.product import ProductService
from app.utils.cache import CacheService

router = APIRouter(prefix="/products", tags=["Products"])


def _get_service(db: DBSession, redis: RedisClient) -> ProductService:
    return ProductService(ProductRepository(db), CacheService(redis))


@router.get("", response_model=PaginatedResponse[ProductListItem], summary="List products")
async def list_products(
    db: DBSession,
    redis: RedisClient,
    pagination: Pagination,
    q: str | None = Query(None, description="Search term"),
    category_id: int | None = None,
    dosha_type: DoshaType | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool | None = None,
    is_featured: bool | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    filters = ProductFilterParams(
        q=q,
        category_id=category_id,
        dosha_type=dosha_type,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        is_featured=is_featured,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    svc = _get_service(db, redis)
    products, total = await svc.repo.list_with_filters(
        filters, offset=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.create(
        items=products,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/featured", response_model=list[ProductListItem], summary="Get featured products")
async def get_featured_products(db: DBSession, redis: RedisClient, limit: int = 8):
    svc = _get_service(db, redis)
    return await svc.repo.get_featured(limit=limit)


@router.get("/{slug}", response_model=ProductDetail, summary="Get product by slug")
async def get_product(slug: str, db: DBSession, redis: RedisClient):
    svc = _get_service(db, redis)
    return await svc.get_product_by_slug(slug)


# ── Admin-only routes ─────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=ProductDetail,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create product",
)
async def create_product(
    data: ProductCreateRequest,
    db: DBSession,
    redis: RedisClient,
    _admin: AdminUser,
):
    svc = _get_service(db, redis)
    return await svc.create_product(data)


@router.patch("/{product_id}", response_model=ProductDetail, summary="[Admin] Update product")
async def update_product(
    product_id: int,
    data: ProductUpdateRequest,
    db: DBSession,
    redis: RedisClient,
    _admin: AdminUser,
):
    svc = _get_service(db, redis)
    return await svc.update_product(product_id, data)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Soft-delete product",
)
async def delete_product(
    product_id: int,
    db: DBSession,
    redis: RedisClient,
    _admin: AdminUser,
):
    svc = _get_service(db, redis)
    await svc.delete_product(product_id)


@router.post(
    "/{product_id}/images",
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Upload product image to Cloudinary",
)
async def upload_image(
    product_id: int,
    db: DBSession,
    redis: RedisClient,
    _admin: AdminUser,
    file: UploadFile = File(...),
    is_primary: bool = False,
):
    svc = _get_service(db, redis)
    return await svc.upload_product_image(product_id, file, is_primary)