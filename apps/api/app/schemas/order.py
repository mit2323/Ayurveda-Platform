"""Order, Cart, Review, Coupon schemas."""
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.order import OrderStatus
from app.models.payment import PaymentStatus
from app.schemas.base import OrmBase


# ── Cart (client-side + API validation) ──────────────────────────────────────
class CartItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1, le=99)


class CartItem(BaseModel):
    product_id: int
    quantity: int
    name: str
    price: Decimal
    image_url: str | None
    slug: str


class CartSummary(BaseModel):
    items: list[CartItem]
    subtotal: Decimal
    item_count: int


# ── Order ─────────────────────────────────────────────────────────────────────
class OrderItemOut(OrmBase):
    id: int
    product_id: int | None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product_snapshot: dict


class PaymentOut(OrmBase):
    id: int
    razorpay_order_id: str
    razorpay_payment_id: str | None
    amount: Decimal
    currency: str
    status: PaymentStatus
    payment_method: str | None


class OrderOut(OrmBase):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    coupon_code: str | None
    shipping_address: dict
    tracking_number: str | None
    items: list[OrderItemOut]
    payment: PaymentOut | None


class CheckoutRequest(BaseModel):
    address_id: int
    coupon_code: str | None = None
    notes: str | None = None


class CreateRazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int          # in paise (INR × 100)
    currency: str
    order_id: int        # our internal order id
    key_id: str          # Razorpay public key for frontend


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: int


# ── Review ────────────────────────────────────────────────────────────────────
class ReviewCreateRequest(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    title: str | None = Field(None, max_length=255)
    body: str | None = Field(None, max_length=2000)


class ReviewOut(OrmBase):
    id: int
    product_id: int
    rating: int
    title: str | None
    body: str | None
    is_verified_purchase: bool
    user_full_name: str | None = None  # populated in service layer


# ── Coupon ────────────────────────────────────────────────────────────────────
class CouponApplyRequest(BaseModel):
    code: str
    order_amount: Decimal


class CouponApplyResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: Decimal
    discount_amount: Decimal
    final_amount: Decimal