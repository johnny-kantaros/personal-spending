# main.py

from fastapi import FastAPI
from src.routes import router as transactions_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Plaid FastAPI")

origins = [
    "http://localhost:3000",
    "https://spending-tracker.vercel.app"
    "http://10.0.0.88:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register routes
app.include_router(transactions_router, prefix="/api")
