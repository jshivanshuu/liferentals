from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


class PropertyStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class TransactionStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class UserCreate(BaseModel):
    email: str
    name: str
    phone: str
    password: str


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    phone: str
    role: UserRole
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class PropertyCreate(BaseModel):
    title: str
    type: str
    listing_type: str
    price: Decimal
    address: str
    city: str
    bedrooms: int
    bathrooms: int
    area: int


class Property(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: str
    listing_type: str
    price: Decimal
    address: str
    city: str
    bedrooms: int
    bathrooms: int
    area: int
    owner_id: int
    status: PropertyStatus
    created_at: datetime


class PropertyStatusUpdate(BaseModel):
    status: PropertyStatus


class TransactionCreate(BaseModel):
    property_id: int
    amount: Decimal


class Transaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int
    buyer_id: int
    seller_id: int
    amount: Decimal
    status: TransactionStatus
    completed_at: datetime | None = None


class WishlistCreate(BaseModel):
    property_id: int


class Wishlist(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    property_id: int
    created_at: datetime
