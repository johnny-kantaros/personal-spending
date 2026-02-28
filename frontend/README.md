# Frontend Setup

Next.js app for viewing transactions and connecting bank accounts.

## Tech

- Next.js 15
- React 19 + TypeScript
- Tailwind CSS 4
- react-plaid-link
- Recharts

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## What's included

- Transaction table with filters
- Spending charts by category
- Plaid Link for connecting banks
- Date filtering (month/year)

## Key files

```
src/app/page.tsx              # Main dashboard
components/transactions/      # Transaction components
lib/api.ts                   # API calls to backend
types/                       # TypeScript types
```

## Deploy

Easiest with Vercel - just connect your repo and set `NEXT_PUBLIC_API_URL` to your backend URL.

Remember to update CORS in the backend to allow your frontend domain.