from fastapi import FastAPI

from .routes import admin, auth, properties, referrals, transactions

app = FastAPI(
    title="Life Rentals API",
    description="Backend API for property rentals.",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(transactions.router)
app.include_router(referrals.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "ok"}
