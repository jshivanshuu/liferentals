from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title = "houserentals", description = "A simple API for house rentals", version = "1.0.0")
@app.get("/")
def read_root():
    return {"Hello": "World"}
@app.get("/login")
def login():
    return {"message": "Login endpoint"}
@app.get("/dashboard")
def dashboard():
    return {"message": "Dashboard endpoint"}
