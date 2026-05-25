from fastapi import APIRouter, HTTPException

from .. import database
from ..schemas import Property, PropertyStatus, PropertyStatusUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/properties/pending", response_model=list[Property])
def list_pending_properties():
    return [
        property_item
        for property_item in database.properties.values()
        if property_item.status == PropertyStatus.pending
    ]


@router.patch("/properties/{property_id}/status", response_model=Property)
def update_property_status(property_id: int, payload: PropertyStatusUpdate):
    property_item = database.properties.get(property_id)
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    updated_property = property_item.copy(update={"status": payload.status})
    database.properties[property_id] = updated_property
    return updated_property
