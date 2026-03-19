"""Reviews API routes — /api/v1/reviews/*"""
from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.core.dependencies import AdminUser, CurrentUser, DBSession, Pagination
from app.models.order import Order, OrderItem, OrderStatus
from app.models.review import Review
from app.schemas.base import PaginatedResponse
from app.schemas.order import ReviewCreateRequest, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post(
    "",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a product review",
)
async def create_review(
    data: ReviewCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
):
    # Check if user already reviewed this product
    existing = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.product_id == data.product_id,
        )
    )
    if existing.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="You have already reviewed this product")

    # Check for verified purchase
    purchase = await db.execute(
        select(OrderItem).join(Order).where(
            Order.user_id == current_user.id,
            Order.status == OrderStatus.DELIVERED,
            OrderItem.product_id == data.product_id,
        )
    )
    is_verified = purchase.scalar_one_or_none() is not None

    review = Review(
        product_id=data.product_id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        body=data.body,
        is_approved=False,  # requires admin approval
        is_verified_purchase=is_verified,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    out = ReviewOut.model_validate(review)
    out.user_full_name = current_user.full_name
    return out


@router.get(
    "/product/{product_id}",
    response_model=PaginatedResponse[ReviewOut],
    summary="Get approved reviews for a product",
)
async def get_product_reviews(
    product_id: int,
    db: DBSession,
    pagination: Pagination,
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id, Review.is_approved == True)
        .options(selectinload(Review.user))
        .order_by(Review.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
    )
    reviews = result.scalars().all()
    total_result = await db.execute(
        select(func.count()).select_from(Review).where(
            Review.product_id == product_id, Review.is_approved == True
        )
    )
    total = total_result.scalar_one()

    items = []
    for r in reviews:
        out = ReviewOut.model_validate(r)
        out.user_full_name = r.user.full_name if r.user else None
        items.append(out)

    return PaginatedResponse.create(
        items=items, total=total, page=pagination.page, page_size=pagination.page_size
    )


@router.patch("/{review_id}/approve", summary="[Admin] Approve a review")
async def approve_review(review_id: int, db: DBSession, _admin: AdminUser):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_approved = True
    await db.commit()
    return {"message": "Review approved"}


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT, summary="[Admin] Delete a review")
async def delete_review(review_id: int, db: DBSession, _admin: AdminUser):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.commit()