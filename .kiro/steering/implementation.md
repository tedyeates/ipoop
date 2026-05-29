# Implementation Constraints

- **Frontend first.** Complete UI against mock data before backend. User approves frontend before backend starts.
- **Local only.** Never depend on cloud in dev. Use local SQLite (same `@libsql/client` interface as Turso). Toggle via env vars.
- **Mock only AI.** Only mock target = external API. Everything else (DB, validation, routing, CORS) runs real locally.
- **Mock/real interface identical** — swap must be seamless.
