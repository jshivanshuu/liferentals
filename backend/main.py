from fastapi import FastAPI
app = FastAPI()
@app.get("/")
def read_root():
    return {"Hello": "World"}
@app.get("/login")
def login():
    return {"message": "Login endpoint"}
@app.get("/dashboard")
def dashboard():
    return {"message": "Dashboard endpoint"}
