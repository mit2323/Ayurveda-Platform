"""Product and ProductImage models."""
import enum
from decimal import Decimal

from sqlalchemy import (
    ARRAY,
    DECIMAL,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DoshaType(str, enum.Enum):
    """Ayurvedic body/mind constitution types."""
    VATA = "vata"
    PITTA = "pitta"
    KAPHA = "kapha"
    TRIDOSHA = "tridosha"  # balances all three
    NONE = "none"


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    sale_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    weight_grams: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    dosha_type: Mapped[DoshaType] = mapped_column(
        Enum(DoshaType, values_callable=lambda x: [e.value for e in x]), default=DoshaType.NONE, nullable=False
    )

    # Ayurvedic-specific JSONB fields (flexible, queryable)
    ingredients: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # e.g. [{"name": "Ashwagandha", "quantity": "500mg"}]
    benefits: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    usage_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    certifications: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # e.g. ["USDA Organic", "ISO 9001", "GMP Certified"]

    # SEO
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Full-text search vector (auto-maintained by Postgres trigger — see migration)
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    # FK
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    category: Mapped["Category | None"] = relationship(  # type: ignore[name-defined]
        "Category", back_populates="products"
    )
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
        lazy="selectin",
    )
    reviews: Mapped[list["Review"]] = relationship(  # type: ignore[name-defined]
        "Review", back_populates="product", lazy="dynamic"
    )
    order_items: Mapped[list["OrderItem"]] = relationship(  # type: ignore[name-defined]
        "OrderItem", back_populates="product"
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(  # type: ignore[name-defined]
        "WishlistItem", back_populates="product"
    )

    @property
    def effective_price(self) -> Decimal:
        """Return sale price if set, otherwise regular price."""
        return self.sale_price if self.sale_price is not None else self.price

    @property
    def is_low_stock(self) -> bool:
        return self.stock <= self.low_stock_threshold

    @property
    def primary_image_url(self) -> str | None:
        for img in self.images:
            if img.is_primary:
                return img.url
        return self.images[0].url if self.images else None

    def __repr__(self) -> str:
        return f"<Product id={self.id} sku={self.sku} name={self.name}>"


class ProductImage(Base, TimestampMixin):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    cloudinary_public_id: Mapped[str] = mapped_column(String(255), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="images")