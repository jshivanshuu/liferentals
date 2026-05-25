from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import Transaction, TransactionCreate, TransactionStatus
from ..security import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=Transaction)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(get_current_user),
):
    property_item = db.query(database.Property).filter(database.Property.id == payload.property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if property_item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy or rent your own property")

    transaction = database.Transaction(
        property_id=property_item.id,
        buyer_id=current_user.id,
        seller_id=property_item.owner_id,
        amount=payload.amount,
        status=TransactionStatus.completed.value,
        completed_at=datetime.utcnow(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("", response_model=list[Transaction])
def list_transactions(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(get_current_user),
):
    query = db.query(database.Transaction)
    if current_user.role != "admin":
        query = query.filter(
            (database.Transaction.buyer_id == current_user.id)
            | (database.Transaction.seller_id == current_user.id)
        )
    return query.all()
