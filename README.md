<<<<<<< HEAD
# Wealth Tracker

Wealth Tracker is a local-first personal finance dashboard for HDFC CSV statements. It imports bank transactions, auto-categorizes them using editable rules, and shows monthly insights tied to spending discipline and investment goals.

## Tech Stack

- Frontend: React, Tailwind CSS, Recharts
- Backend: Node.js, Express
- Database: SQLite
- CSV Parsing: Papa Parse

## Project Structure

```text
backend/   Express API, SQLite schema, CSV import, metrics, insights
frontend/  React UI for upload, dashboard, transactions, rules, and goals
```

## Features

- Upload HDFC CSV files and normalize Date, Narration, Debit, and Credit fields
- Store transactions locally in SQLite
- Auto-categorize transactions using keyword-based rules
- Edit categories, rules, and goals from the UI
- View monthly dashboard metrics including income vs expense, savings rate, expense by category, mandatory vs optional spend, top merchants, and goal tracking

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start the backend

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:4000`.

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Root Scripts

If you prefer running commands from the project root:

```bash
npm run dev:backend
npm run dev:frontend
```

## Notes

- This is a local-use app with no authentication.
- The SQLite database is created at `backend/wealth-tracker.db`.
- `node_modules`, build output, database files, and ZIP exports are ignored from git.
=======
# wealth_tracker_codex
>>>>>>> 66aaa20c2803c6f47d1fbf1cdbe19e99ffc763c4
