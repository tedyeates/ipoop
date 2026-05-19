# Tech Stack & Build System

## Package Manager
- **pnpm** (strict — no `package-lock.json` or `yarn.lock`; `pnpm-lock.yaml` is canonical)

## Frontend
| Concern | Choice |
|---------|--------|
| Framework | React 18 |
| Build tool | Vite |
| Styling | Tailwind CSS v3 (utility-first) |
| Routing | React Router |
| Hosting | Vercel |

## Backend
| Concern | Choice |
|---------|--------|
| Runtime | Deno (edge functions on Deno Deploy) |
| Language | TypeScript |
| Database | Turso (libSQL / SQLite) |
| AI | Anthropic Claude Haiku 3.5 (text + vision) |

## Common Commands

```bash
# Frontend
pnpm install          # install deps
pnpm dev              # local dev server (Vite)
pnpm build            # production build
pnpm preview          # preview production build locally

# Backend (Deno)
deno task dev         # local dev server
deno task start       # production start
deno lint             # lint
deno fmt              # format
```

## Environment Variables

### Deno Deploy (backend)
- `ANTHROPIC_API_KEY`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CORS_ORIGIN` (Vercel frontend URL)

### Vercel (frontend)
- `VITE_API_BASE_URL` (Deno backend URL)

## Key Libraries & APIs
- `@libsql/client` — Turso database client
- `@anthropic-ai/sdk` — Claude API (hypothesis engine + ingredient scan)
- ULIDs for all primary keys
- ISO8601 for all datetime fields
