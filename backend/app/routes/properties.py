from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Property, PropertyCreate, PropertyStatus
from ..security import get_current_user

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=list[Property])
def list_properties(
    city: str | None = None,
    status: PropertyStatus | None = None,
    db: Session = Depends(database.get_db),
):
    query = db.query(database.Property)

    if city:
        query = query.filter(database.Property.city == city)

    if status:
        query = query.filter(database.Property.status == status.value)

    return query.all()


@router.post("", response_model=Property)
def create_property(
    payload: PropertyCreate,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(get_current_user),
):
    property_data = payload.model_dump()
    property_item = database.Property(
        status=PropertyStatus.pending.value,
        owner_id=current_user.id,
        **property_data,
    )
    db.add(property_item)
    db.commit()
    db.refresh(property_item)
    return property_item


@router.get("/{property_id}", response_model=Property)
def get_property(property_id: int, db: Session = Depends(database.get_db)):
    property_item = db.query(database.Property).filter(database.Property.id == property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_item
