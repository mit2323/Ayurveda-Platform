"""Category model — supports parent/child hierarchy."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Self-referential hierarchy: subcategories
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    parent: Mapped["Category | None"] = relationship(
        "Category", back_populates="children", remote_side="Category.id"
    )
    children: Mapped[list["Category"]] = relationship(
        "Category", back_populates="parent"
    )

    # Products in this category
    products: Mapped[list["Product"]] = relationship(  # type: ignore[name-defined]
        "Product", back_populates="category", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"