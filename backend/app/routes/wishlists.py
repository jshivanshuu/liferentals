from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Wishlist, WishlistCreate
from ..security import get_current_user

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.post("", response_model=Wishlist)
def add_to_wishlist(
    payload: WishlistCreate,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(get_current_user),
):
    property_item = db.query(database.Property).filter(database.Property.id == payload.property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    existing_item = (
        db.query(database.Wishlist)
        .filter(
            database.Wishlist.user_id == current_user.id,
            database.Wishlist.property_id == payload.property_id,
        )
        .first()
    )
    if existing_item:
        raise HTTPException(status_code=400, detail="Property already in wishlist")

    wishlist_item = database.Wishlist(user_id=current_user.id, property_id=payload.property_id)
    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)
    wishlist_item.property = property_item
    return wishlist_item


@router.get("/users/{user_id}", response_model=list[Wishlist])
def list_user_wishlist(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own wishlist")

    user = db.query(database.User).filter(database.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = db.query(database.Wishlist).filter(database.Wishlist.user_id == user_id).all()
    for item in items:
        item.property = db.query(database.Property).filter(database.Property.id == item.property_id).first()
    return items


@router.delete("/{wishlist_id}")
def remove_from_wishlist(
    wishlist_id: int,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(get_current_user),
):
    wishlist_item = db.query(database.Wishlist).filter(database.Wishlist.id == wishlist_id).first()
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    if current_user.role != "admin" and wishlist_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only remove your own wishlist items")

    db.delete(wishlist_item)
    db.commit()
    return {"message": "Removed from wishlist"}

