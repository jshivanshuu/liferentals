from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Referral, ReferralCreate, ReferralStatus

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.post("", response_model=Referral)
def create_referral(payload: ReferralCreate, db: Session = Depends(database.get_db)):
    property_item = db.query(database.Property).filter(database.Property.id == payload.property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    landlord = db.query(database.User).filter(database.User.id == payload.landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")

    tenant = db.query(database.User).filter(database.User.id == payload.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    referral = database.Referral(
        status=ReferralStatus.pending.value,
        **payload.dict(),
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral


@router.get("", response_model=list[Referral])
def list_referrals(db: Session = Depends(database.get_db)):
    return db.query(database.Referral).all()
