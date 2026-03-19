"""Product request/response schemas."""
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.product import DoshaType
from app.schemas.base import OrmBase


# ── Image ─────────────────────────────────────────────────────────────────────
class ProductImageOut(OrmBase):
    id: int
    url: str
    alt_text: str | None
    is_primary: bool
    sort_order: int


# ── Category ──────────────────────────────────────────────────────────────────
class CategoryOut(OrmBase):
    id: int
    name: str
    slug: str
    image_url: str | None


# ── Product list item (lightweight) ───────────────────────────────────────────
class ProductListItem(OrmBase):
    id: int
    name: str
    slug: str
    price: Decimal
    sale_price: Decimal | None
    stock: int
    is_active: bool
    is_featured: bool
    dosha_type: DoshaType
    primary_image_url: str | None
    category: CategoryOut | None
    average_rating: float | None = None
    review_count: int = 0


# ── Product detail (full) ─────────────────────────────────────────────────────
class ProductDetail(ProductListItem):
    sku: str
    description: str | None
    short_description: str | None
    ingredients: list | None
    benefits: list | None
    usage_instructions: str | None
    certifications: list | None
    weight_grams: int | None
    meta_title: str | None
    meta_description: str | None
    images: list[ProductImageOut]


# ── Create / Update ───────────────────────────────────────────────────────────
class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    short_description: str | None = Field(None, max_length=500)
    sku: str = Field(..., min_length=2, max_length=100)
    price: Decimal = Field(..., gt=0)
    sale_price: Decimal | None = Field(None, gt=0)
    stock: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)
    category_id: int | None = None
    dosha_type: DoshaType = DoshaType.NONE
    ingredients: list | None = None
    benefits: list | None = None
    usage_instructions: str | None = None
    certifications: list | None = None
    weight_grams: int | None = Field(None, gt=0)
    is_active: bool = True
    is_featured: bool = False
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)

    @field_validator("sale_price")
    @classmethod
    def sale_price_less_than_price(cls, v: Decimal | None, info) -> Decimal | None:
        if v is not None and "price" in info.data and v >= info.data["price"]:
            raise ValueError("sale_price must be less than price")
        return v


class ProductUpdateRequest(BaseModel):
    """All fields optional for PATCH semantics."""
    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    short_description: str | None = None
    price: Decimal | None = Field(None, gt=0)
    sale_price: Decimal | None = Field(None, gt=0)
    stock: int | None = Field(None, ge=0)
    low_stock_threshold: int | None = Field(None, ge=0)
    category_id: int | None = None
    dosha_type: DoshaType | None = None
    ingredients: list | None = None
    benefits: list | None = None
    usage_instructions: str | None = None
    certifications: list | None = None
    weight_grams: int | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    meta_title: str | None = None
    meta_description: str | None = None


# ── Filters (for query params) ────────────────────────────────────────────────
class ProductFilterParams(BaseModel):
    q: str | None = None                    # full-text search
    category_id: int | None = None
    dosha_type: DoshaType | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    in_stock: bool | None = None
    is_featured: bool | None = None
    sort_by: str = "created_at"             # price | name | rating | created_at
    sort_order: str = "desc"               # asc | desc