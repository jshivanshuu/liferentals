import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Integer, Numeric, String, create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME")

if DB_USER and DB_PASSWORD and DB_NAME:
    DATABASE_URL = URL.create(
        "mysql+pymysql",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
    )
else:
    DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Database settings are missing. Add DB_USER, DB_PASSWORD, and DB_NAME to .env.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)
    listing_type = Column(String(50), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    area = Column(Integer, nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=False, index=True)
    buyer_id = Column(Integer, nullable=False, index=True)
    seller_id = Column(Integer, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default="completed", nullable=False)
    completed_at = Column(DateTime, nullable=True)


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=False, index=True)
    landlord_id = Column(Integer, nullable=False, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    referred_by_user_id = Column(Integer, nullable=True, index=True)
    monthly_rent = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


def create_db_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
