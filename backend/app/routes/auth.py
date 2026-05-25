from datetime import datetime

from fastapi import APIRouter, HTTPException

from .. import database
from ..schemas import LoginRequest, User, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User)
def register_user(payload: UserCreate):
    for user in database.users.values():
        if user.email == payload.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=database.next_id(database.users),
        created_at=datetime.utcnow(),
        **payload.dict(),
    )
    database.users[user.id] = user
    return user


@router.post("/login", response_model=User)
def login(payload: LoginRequest):
    for user in database.users.values():
        if user.email == payload.email:
            return user
    raise HTTPException(status_code=404, detail="User not found")
