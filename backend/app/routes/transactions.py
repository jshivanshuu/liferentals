from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Transaction, TransactionCreate, TransactionStatus

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=Transaction)
def create_transaction(payload: TransactionCreate, db: Session = Depends(database.get_db)):
    property_item = db.query(database.Property).filter(database.Property.id == payload.property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    buyer = db.query(database.User).filter(database.User.id == payload.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    seller = db.query(database.User).filter(database.User.id == payload.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    transaction = database.Transaction(
        status=TransactionStatus.completed.value,
        completed_at=datetime.utcnow(),
        **payload.dict(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("", response_model=list[Transaction])
def list_transactions(db: Session = Depends(database.get_db)):
    return db.query(database.Transaction).all()
