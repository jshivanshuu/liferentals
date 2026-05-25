from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Property, PropertyCreate, PropertyStatus

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
def create_property(payload: PropertyCreate, db: Session = Depends(database.get_db)):
    owner = db.query(database.User).filter(database.User.id == payload.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    property_item = database.Property(
        status=PropertyStatus.pending.value,
        **payload.dict(),
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
