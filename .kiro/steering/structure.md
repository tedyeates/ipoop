# Project Structure

## High-Level Layout

```
/
├── frontend/              # React SPA (Vite + pnpm)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API client, utilities
│   │   └── assets/        # Static assets
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/               # Deno Deploy edge functions
│   ├── routes/            # API route handlers
│   ├── db/                # Database schema, migrations, queries
│   ├── ai/               # Claude prompts and AI integration
│   ├── lib/              # Shared utilities
│   └── deno.json         # Deno config & tasks
│
└── ibs-tracker-spec.md   # Project specification (source of truth)
```

## Frontend Routes

| Path | Purpose |
|------|---------|
| `/` | Dashboard — today's summary, quick-log buttons, hypothesis snapshot |
| `/log/meal` | Meal logging form (with optional photo scan) |
| `/log/stool` | Stool logging form |
| `/log/context` | Daily context form (stress, sleep, water, exercise, etc.) |
| `/log/symptoms` | Symptom logging form |
| `/history` | Scrollable log history grouped by day |
| `/hypotheses` | Full hypothesis view with confidence ratings |
| `/settings` | API key config, data export |

## Backend API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| CRUD | `/api/meals` | Meal log operations |
| CRUD | `/api/stools` | Stool log operations |
| CRUD | `/api/context` | Context log operations |
| CRUD | `/api/symptoms` | Symptom log operations |
| POST | `/api/scan-ingredients` | Photo → ingredient/FODMAP extraction (Claude vision) |
| POST | `/api/review` | Trigger AI hypothesis review |
| GET | `/api/hypotheses` | Fetch current hypothesis record |
| GET | `/api/export` | Export all data (JSON or CSV) |

## Database Tables
- `meal_logs` — food intake with FODMAP flags
- `stool_logs` — Bristol scale events
- `context_logs` — daily lifestyle factors
- `symptom_logs` — symptom severity scores
- `hypotheses` — AI-generated trigger hypotheses (single row, overwritten each review)

## Conventions
- Mobile-first, single-column layouts
- Bottom navigation bar (5 items: Home, Meal, Stool, Context, Symptoms)
- Minimum 44px tap targets
- Quick-log flow: ≤3 taps from icon to submission
