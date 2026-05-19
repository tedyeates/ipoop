# iPoop — IBS Trigger Tracker

A personal, mobile-first web application for logging food intake and bowel health data, then using AI to identify probable IBS triggers with confidence ratings.

## What It Does

- **Meal logging** with FODMAP category tagging, portion sizes, and optional AI-powered ingredient photo scanning
- **Stool logging** using the Bristol Stool Scale with pain, urgency, and frequency tracking
- **Daily context logging** — stress, sleep, hydration, exercise, caffeine, alcohol, medications, menstrual phase
- **Symptom logging** — bloating, cramping, nausea, urgency, fatigue severity scores
- **AI hypothesis engine** — correlates diet and lifestyle data with symptoms over a 6–24 hour transit window to surface probable triggers with confidence ratings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, React Router |
| Backend | Deno Deploy (TypeScript edge functions) |
| Database | Turso (libSQL / SQLite) |
| AI | Anthropic Claude Haiku 3.5 (text + vision) |
| Hosting | Vercel (frontend), Deno Deploy (backend) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) package manager
- [Deno](https://deno.land/) runtime
- A [Turso](https://turso.tech/) database
- An [Anthropic](https://www.anthropic.com/) API key

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Set the environment variable:
- `VITE_API_BASE_URL` — URL of your Deno backend

### Backend

```bash
cd backend
deno task dev
```

Set the environment variables:
- `TURSO_DATABASE_URL` — your Turso database URL
- `TURSO_AUTH_TOKEN` — your Turso auth token
- `ANTHROPIC_API_KEY` — your Claude API key
- `CORS_ORIGIN` — your frontend URL

### Database Setup

Run the schema against your Turso database:

```bash
turso db shell <your-db-name> < backend/db/schema.sql
```

## Project Structure

```
├── frontend/          # React SPA (Vite + pnpm)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── lib/
├── backend/           # Deno Deploy edge functions
│   ├── routes/
│   ├── db/
│   ├── ai/
│   └── lib/
└── .kiro/specs/       # Feature specifications
```

## Deployment

**Backend** → Deno Deploy (set env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `CORS_ORIGIN`)

**Frontend** → Vercel (set env var: `VITE_API_BASE_URL`)

## Disclaimer

This is a personal research tool and **not a medical device**. AI-generated hypotheses are suggestions, not clinical diagnoses. Always consult a healthcare professional for medical advice.

## License

This project is licensed under the [CC BY-NC 4.0 License](./LICENSE) — free for non-commercial use.
