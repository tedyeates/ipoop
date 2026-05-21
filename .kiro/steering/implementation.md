# Implementation Constraints

- **Frontend first.** Build complete UI against mock data before any backend code. User must approve frontend before backend begins.
- **Local only.** Never depend on cloud services during development. Use local SQLite (same `@libsql/client` interface as Turso). Toggle via env vars.
- **Mock only AI.** The only acceptable mock target is the external Anthropic API. Everything else (DB, validation, routing, CORS) runs real locally.
- **Keep mock/real interface identical** so the swap is seamless.
