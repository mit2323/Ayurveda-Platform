"""Users API routes — /api/v1/users/*"""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DBSession
from app.core.security import hash_password, verify_password
from app.models.address import Address
from app.models.wishlist import WishlistItem
from app.schemas.auth import UserPublic
from app.schemas.order import CartItemRequest

router = APIRouter(prefix="/users", tags=["Users"])


# ── Profile ───────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserPublic)
async def get_profile(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserPublic)
async def update_profile(
    full_name: str | None = None,
    phone: str | None = None,
    current_user: CurrentUser = None,
    db: DBSession = None,
):
    if full_name:
        current_user.full_name = full_name
    if phone:
        current_user.phone = phone
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: CurrentUser,
    db: DBSession,
):
    if not current_user.password_hash:
        raise HTTPException(400, "OAuth users cannot change password here")
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    current_user.password_hash = hash_password(new_password)
    await db.commit()
    return {"message": "Password updated"}


# ── Addresses ─────────────────────────────────────────────────────────────────
@router.get("/me/addresses")
async def list_addresses(current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Address).where(Address.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/me/addresses", status_code=status.HTTP_201_CREATED)
async def add_address(
    label: str,
    full_name: str,
    phone: str,
    line1: str,
    city: str,
    state: str,
    pincode: str,
    line2: str | None = None,
    is_default: bool = False,
    current_user: CurrentUser = None,
    db: DBSession = None,
):
    if is_default:
        # Unset existing default
        result = await db.execute(
            select(Address).where(
                Address.user_id == current_user.id, Address.is_default == True
            )
        )
        for addr in result.scalars().all():
            addr.is_default = False

    address = Address(
        user_id=current_user.id,
        label=label,
        full_name=full_name,
        phone=phone,
        line1=line1,
        line2=line2,
        city=city,
        state=state,
        pincode=pincode,
        is_default=is_default,
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(address_id: int, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Address).where(
            Address.id == address_id, Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(404, "Address not found")
    await db.delete(address)
    await db.commit()


# ── Wishlist ──────────────────────────────────────────────────────────────────
@router.get("/me/wishlist")
async def get_wishlist(current_user: CurrentUser, db: DBSession):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == current_user.id)
        .options(selectinload(WishlistItem.product))
    )
    return result.scalars().all()


@router.post("/me/wishlist/{product_id}", status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(product_id: int, current_user: CurrentUser, db: DBSession):
    existing = await db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == product_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Already in wishlist")
    item = WishlistItem(user_id=current_user.id, product_id=product_id)
    db.add(item)
    await db.commit()
    return {"message": "Added to wishlist"}


@router.delete("/me/wishlist/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(product_id: int, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == product_id,
        )
    )
    item = result.scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.commit()