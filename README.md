# Personal Spending Tracker

Track your spending by connecting bank accounts through Plaid. Automatically syncs transactions and shows you where your money goes.

## What it does

- Connects to your banks via Plaid
- Syncs transactions automatically
- Shows spending by category with charts
- Filter by date and account

## Tech

**Backend**: FastAPI + SQLModel + SQLite + Plaid
**Frontend**: Next.js + React + TypeScript + Tailwind

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Plaid API credentials ([sign up here](https://dashboard.plaid.com/signup))

### Get it running

1. **Backend setup**
```bash
cd backend
# Add your Plaid credentials to a .env file
poetry install
uvicorn main:app --reload --port 8000
```

See [backend/README.md](backend/README.md) for more details.

2. **Frontend setup**
```bash
cd frontend
npm install
npm run dev
```

See [frontend/README.md](frontend/README.md) for more details.

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`

## Key Features

- Connect multiple bank accounts
- Automatic transaction syncing
- Category-based spending charts
- Filter by month/year
- Multi-account support
