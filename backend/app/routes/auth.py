from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database
from ..schemas import AuthResponse, LoginRequest, User, UserCreate, UserRole
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_NAME = "Shivanshu Jha"
ADMIN_EMAIL = "jhashivanshu5521@gmail.com"
ADMIN_PHONE = "6393055276"


def is_admin_identity(name: str, email: str, phone: str) -> bool:
    return (
        name.strip().casefold() == ADMIN_NAME.casefold()
        and email.strip().casefold() == ADMIN_EMAIL.casefold()
        and phone.strip() == ADMIN_PHONE
    )


@router.post("/register", response_model=AuthResponse)
def register_user(payload: UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(database.User).filter(database.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = payload.model_dump(exclude={"password"})
    user_data["password_hash"] = hash_password(payload.password)
    user_data["role"] = (
        UserRole.admin.value
        if is_admin_identity(payload.name, payload.email, payload.phone)
        else UserRole.user.value
    )

    user = database.User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user), "user": user}


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter(database.User.email == payload.email).first()
    if user:
        if not user.password_hash:
            user.password_hash = hash_password(payload.password)
            db.commit()
            db.refresh(user)
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        expected_role = (
            UserRole.admin.value
            if is_admin_identity(user.name, user.email, user.phone)
            else UserRole.user.value
        )
        if user.role != expected_role:
            user.role = expected_role
            db.commit()
            db.refresh(user)
        return {"access_token": create_access_token(user), "user": user}
    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.get("/me", response_model=User)
def get_me(current_user: database.User = Depends(get_current_user)):
    return current_user
