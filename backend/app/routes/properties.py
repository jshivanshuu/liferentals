from datetime import datetime

from fastapi import APIRouter, HTTPException

from .. import database
from ..schemas import Property, PropertyCreate, PropertyStatus

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=list[Property])
def list_properties(city: str | None = None, status: PropertyStatus | None = None):
    results = list(database.properties.values())

    if city:
        results = [item for item in results if item.city.lower() == city.lower()]

    if status:
        results = [item for item in results if item.status == status]

    return results


@router.post("", response_model=Property)
def create_property(payload: PropertyCreate):
    if payload.owner_id not in database.users:
        raise HTTPException(status_code=404, detail="Owner not found")

    property_item = Property(
        id=database.next_id(database.properties),
        status=PropertyStatus.pending,
        created_at=datetime.utcnow(),
        **payload.dict(),
    )
    database.properties[property_item.id] = property_item
    return property_item


@router.get("/{property_id}", response_model=Property)
def get_property(property_id: int):
    property_item = database.properties.get(property_id)
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_item
