# Sweety — Blood Glucose Tracker

Track your glucose, simply.

Full-stack app: React (Vite) frontend + Node.js/Express API + PostgreSQL (Supabase).

## Live URLs

- **Frontend (Vercel)**: _Coming soon — deploy after this commit_
- **Backend (Render)**: _Coming soon — deploy after this commit_

## Demo login

- Email: `demo@sweety.app`
- Password: `Demo1234!`

## Prerequisites

- Node.js 18+
- A Supabase project (or any Postgres)

## Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/Mohammad-Faiz-Dev/sweety-glucose-tracker.git
   cd sweety-glucose-tracker
   ```

2. Server environment:

   ```bash
   cd server
   cp .env.example .env
   ```

   Edit `server/.env` and set:
   - `DATABASE_URL` — from Supabase → Settings → Database → Connection string (URI)
   - `JWT_SECRET` — a long random string
   - `CLIENT_ORIGIN` — your frontend origin (e.g. `http://localhost:5173` or your Vercel URL)

3. Client environment:

   ```bash
   cd ../client
   cp .env.example .env.local
   ```

   Set `VITE_API_URL` to your API (e.g. `http://localhost:4000/api` or your Render URL).

4. Install and migrate:

   ```bash
   cd ../server
   npm install
   npm run migrate
   npm run seed
   ```

5. Client:

   ```bash
   cd ../client
   npm install
   ```

## Running

- API: `cd server && npm run dev` → http://localhost:4000
- Frontend: `cd client && npm run dev` → http://localhost:5173

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/readings` | Yes | List readings (newest first) |
| POST | `/api/readings` | Yes | Create reading |
| PUT | `/api/readings/:id` | Yes | Update reading |
| DELETE | `/api/readings/:id` | Yes | Delete reading |
| GET | `/api/reports?type=daily\|weekly\|mtd\|monthly&date=YYYY-MM-DD` | Yes | Stats + readings |

## Validation

Exact messages enforced on client and server:
- Missing value → “Please enter a glucose value.”
- Not integer 40–600 → “Value must be between 40 and 600 mg/dl.”
- Duplicate slot → “You already have an [slot] reading for this date.”
- >4 per day → “You can add only 4 readings per day.”
- Future date → “Date cannot be in the future.”

## Notes

- Passwords hashed with bcrypt.
- JWT in localStorage.
- Time slots: Morning (fasting), After breakfast, After lunch, After dinner.
- Color coding: <70 amber, 70–140 green, >140 coral (display only).
- Reports include highest, lowest, average, time-in-range %, high/low counts.
- Seed creates demo user + ~30 days of sample readings.

## Deployment

- Backend: Render (Web Service, Node, start `npm start`)
- Frontend: Vercel (root directory `client`, framework Vite)

Enjoy tracking!
