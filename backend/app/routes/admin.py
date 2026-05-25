from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Property, PropertyStatus, PropertyStatusUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/properties/pending", response_model=list[Property])
def list_pending_properties(db: Session = Depends(database.get_db)):
    return (
        db.query(database.Property)
        .filter(database.Property.status == PropertyStatus.pending.value)
        .all()
    )


@router.patch("/properties/{property_id}/status", response_model=Property)
def update_property_status(
    property_id: int,
    payload: PropertyStatusUpdate,
    db: Session = Depends(database.get_db),
):
    property_item = db.query(database.Property).filter(database.Property.id == property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    property_item.status = payload.status.value
    db.commit()
    db.refresh(property_item)
    return property_item
