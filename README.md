# Sweety — Blood Glucose Tracker

Track your glucose, simply.

A polished full-stack take-home project: React (Vite) frontend + Node.js/Express API + PostgreSQL.

## Prerequisites

- Node.js 18+
- Docker (for Postgres) or a local PostgreSQL instance

## Setup

1. Clone / extract the project and enter the root.

2. Start Postgres:

   ```bash
   docker compose up -d
   ```

3. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` if needed (defaults work with the docker-compose).

4. Install and set up the server:

   ```bash
   cd server
   npm install
   npm run migrate
   npm run seed
   ```

5. Install the client:

   ```bash
   cd ../client
   npm install
   ```

## Running

- API (from `server/`):

  ```bash
  npm run dev
  ```

  Runs on http://localhost:4000

- Frontend (from `client/`):

  ```bash
  npm run dev
  ```

  Opens on http://localhost:5173

Demo account (after seed):

- Email: `demo@sweety.app`
- Password: `Demo1234!`

## Project structure

- `/server` — Express REST API, auth, readings, reports, migrations, seed
- `/client` — React Vite app with protected routes, forms, reports + charts
- `docker-compose.yml` — Postgres
- `.env.example` — required variables

## API

- `POST /api/auth/signup` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/readings` — list (auth, newest first, optional pagination)
- `POST /api/readings` — create
- `PUT /api/readings/:id` — update
- `DELETE /api/readings/:id` — delete
- `GET /api/reports?type=daily|mtd|monthly&date=YYYY-MM-DD`

All reading/report routes require `Authorization: Bearer <token>`.

## Validation

Enforced on client and server with the exact messages specified in the brief.

## Notes / Assumptions

- JWT stored in localStorage (simple for demo; httpOnly cookie would be more secure).
- Time slots stored as VARCHAR with CHECK constraint (easier than Postgres ENUM for migrations).
- Reports return the list of readings so the frontend can draw the Recharts line chart.
- Pagination is supported on the API (`?page=&limit=`) but the UI currently loads the latest 100.
- No real medical advice — purely a tracker.
- Color coding is display-only (<70 amber, 70–140 green, >140 coral).

## What I’d improve with more time

- Proper httpOnly cookie sessions + refresh tokens
- Full pagination UI + date-range filters
- React Testing Library tests for the form validation messages
- Better error boundaries and loading states
- Docker Compose that also starts the API and client
- Input sanitization / rate limiting
- Accessibility audit and keyboard navigation polish
- Unit tests for the report date-range logic

Enjoy tracking!
