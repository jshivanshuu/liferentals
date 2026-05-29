import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_db_tables
from .routes import admin, auth, properties, transactions, wishlists


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

# Load CORS origins from env, defaulting to localhost for dev
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(transactions.router)
app.include_router(wishlists.router)
app.include_router(admin.router)

@app.get("/")
def health_check():
    return {"status": "ok"}
