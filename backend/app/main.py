from contextlib import asynccontextmanager

from fastapi import FastAPI

from .database import create_db_tables
from .routes import admin, auth, properties, referrals, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_tables()
    yield

app = FastAPI(
    title="Life Rentals API",
    description="Backend API for property rentals.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(transactions.router)
app.include_router(referrals.router)
app.include_router(admin.router)

@app.get("/")
def health_check():
    return {"status": "ok"}
