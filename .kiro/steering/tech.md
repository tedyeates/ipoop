# Tech Stack Gotchas

## Package Manager
- **pnpm only** — no npm or yarn. `pnpm-lock.yaml` is canonical.

## Commands

```bash
# Frontend
pnpm install
pnpm dev
pnpm build

# Backend (Deno)
deno task dev
deno task start
deno lint
deno fmt
```

## Environment Variables

### Backend (Deno Deploy)
- `ANTHROPIC_API_KEY`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CORS_ORIGIN`

### Frontend (Vercel)
- `VITE_API_BASE_URL`

## Conventions
- ULIDs for all primary keys
- ISO8601 for all datetime fields
