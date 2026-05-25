from datetime import datetime

from fastapi import APIRouter, HTTPException

from .. import database
from ..schemas import Transaction, TransactionCreate, TransactionStatus

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=Transaction)
def create_transaction(payload: TransactionCreate):
    if payload.property_id not in database.properties:
        raise HTTPException(status_code=404, detail="Property not found")

    if payload.buyer_id not in database.users:
        raise HTTPException(status_code=404, detail="Buyer not found")

    if payload.seller_id not in database.users:
        raise HTTPException(status_code=404, detail="Seller not found")

    transaction = Transaction(
        id=database.next_id(database.transactions),
        status=TransactionStatus.completed,
        completed_at=datetime.utcnow(),
        **payload.dict(),
    )
    database.transactions[transaction.id] = transaction
    return transaction


@router.get("", response_model=list[Transaction])
def list_transactions():
    return list(database.transactions.values())
