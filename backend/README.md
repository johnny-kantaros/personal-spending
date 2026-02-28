# Backend Setup

FastAPI backend that connects to Plaid and manages transactions.

## Tech

- FastAPI
- SQLModel + SQLite
- Plaid Python SDK
- Uvicorn

## Setup

### 1. Get Plaid credentials

Sign up at https://dashboard.plaid.com/signup and grab your `client_id` and `secret`. Start with sandbox mode.

### 2. Create .env file

Create a `.env` file in the `backend/` directory:

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
```

### 3. Install dependencies

Using Poetry:
```bash
poetry install
```

Or pip:
```bash
pip install -e .
```

### 4. Run the server

```bash
poetry run uvicorn main:app --reload --port 8000
```

Or:
```bash
uvicorn main:app --reload --port 8000
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

## Main Endpoints

- `POST /api/create_link_token` - Get token for Plaid Link
- `POST /api/exchange_public_token` - Exchange public token
- `GET /api/transactions` - Get transactions (with filters)
- `POST /api/transactions/sync` - Sync transactions from Plaid
- `GET /api/transactions/by-category` - Spending by category
- `GET /api/items` - Get connected accounts

Check `/docs` for full API documentation.

## Database

SQLite database gets created automatically on first run. Tables:
- `Item` - Connected bank accounts
- `Transaction` - Transaction data from Plaid

## Plaid Modes

- **sandbox** - Free, fake data for testing
- **development** - Limited free tier, real banks
- **production** - Needs Plaid approval

Start with sandbox.
