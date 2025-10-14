# main.py

from fastapi import FastAPI
from src.routes import router as transactions_router

app = FastAPI(title="Plaid FastAPI")

# Register routes
app.include_router(transactions_router, prefix="/api")
