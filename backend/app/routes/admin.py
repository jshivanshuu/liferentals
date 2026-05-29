from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Property
from ..security import require_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


def serialize_property(property_item: database.Property):
    return {
        "id": property_item.id,
        "title": property_item.title,
        "type": property_item.type,
        "listing_type": property_item.listing_type,
        "price": float(property_item.price),
        "address": property_item.address,
        "city": property_item.city,
        "bedrooms": property_item.bedrooms,
        "bathrooms": property_item.bathrooms,
        "area": property_item.area,
        "owner_id": property_item.owner_id,
        "created_at": property_item.created_at,
    }


def serialize_transaction(transaction: database.Transaction):
    return {
        "id": transaction.id,
        "property_id": transaction.property_id,
        "buyer_id": transaction.buyer_id,
        "seller_id": transaction.seller_id,
        "amount": float(transaction.amount),
        "status": transaction.status,
        "completed_at": transaction.completed_at,
    }




@router.get("/properties", response_model=list[Property])
def list_all_properties(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(require_admin_user),
):
    return db.query(database.Property).all()


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(require_admin_user),
):
    total_revenue = db.query(func.coalesce(func.sum(database.Transaction.amount), 0)).scalar()
    return {
        "users": db.query(database.User).count(),
        "properties": db.query(database.Property).count(),
        "transactions": db.query(database.Transaction).count(),
        "wishlist_items": db.query(database.Wishlist).count(),
        "revenue": float(total_revenue or 0),
    }


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(require_admin_user),
):
    recent_properties = db.query(database.Property).order_by(database.Property.created_at.desc()).limit(5).all()
    recent_transactions = (
        db.query(database.Transaction)
        .order_by(database.Transaction.completed_at.desc())
        .limit(5)
        .all()
    )
    return {
        "analytics": get_analytics(db=db, current_user=current_user),
        "recent_properties": [serialize_property(property_item) for property_item in recent_properties],
        "recent_transactions": [serialize_transaction(transaction) for transaction in recent_transactions],
    }


