from datetime import datetime

from fastapi import APIRouter, HTTPException

from .. import database
from ..schemas import Referral, ReferralCreate, ReferralStatus

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.post("", response_model=Referral)
def create_referral(payload: ReferralCreate):
    if payload.property_id not in database.properties:
        raise HTTPException(status_code=404, detail="Property not found")

    if payload.landlord_id not in database.users:
        raise HTTPException(status_code=404, detail="Landlord not found")

    if payload.tenant_id not in database.users:
        raise HTTPException(status_code=404, detail="Tenant not found")

    referral = Referral(
        id=database.next_id(database.referrals),
        status=ReferralStatus.pending,
        created_at=datetime.utcnow(),
        **payload.dict(),
    )
    database.referrals[referral.id] = referral
    return referral


@router.get("", response_model=list[Referral])
def list_referrals():
    return list(database.referrals.values())
