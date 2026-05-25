from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import LoginRequest, User, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User)
def register_user(payload: UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(database.User).filter(database.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = database.User(
        **payload.dict(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=User)
def login(payload: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter(database.User.email == payload.email).first()
    if user:
        return user
    raise HTTPException(status_code=404, detail="User not found")
