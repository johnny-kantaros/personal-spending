# main.py

from fastapi import FastAPI
from src.api.routes import router as transactions_router
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.db.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db()
    print("✅ Database initialized.")

    # Yield control to the app (this runs during the app's lifetime)
    yield

    # Shutdown logic (optional)
    print("👋 App shutting down...")


app = FastAPI(title="Plaid FastAPI", lifespan=lifespan)

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