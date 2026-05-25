from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel


class UserRole(str, Enum):
    buyer = "buyer"
    seller = "seller"
    admin = "admin"


class PropertyStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class TransactionStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class ReferralStatus(str, Enum):
    pending = "pending"
    rewarded = "rewarded"
    rejected = "rejected"


class UserCreate(BaseModel):
    email: str
    name: str
    phone: str
    role: UserRole


class User(UserCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class LoginRequest(BaseModel):
    email: str


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
    owner_id: int


class Property(PropertyCreate):
    id: int
    status: PropertyStatus
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class PropertyStatusUpdate(BaseModel):
    status: PropertyStatus


class TransactionCreate(BaseModel):
    property_id: int
    buyer_id: int
    seller_id: int
    amount: Decimal


class Transaction(TransactionCreate):
    id: int
    status: TransactionStatus
    completed_at: datetime | None = None

    class Config:
        orm_mode = True
        from_attributes = True


class ReferralCreate(BaseModel):
    property_id: int
    landlord_id: int
    tenant_id: int
    monthly_rent: Decimal


class Referral(ReferralCreate):
    id: int
    referred_by_user_id: int | None = None
    status: ReferralStatus
    end_date: datetime | None = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
