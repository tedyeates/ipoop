# Corrections Log

<!-- Entries added automatically when mistakes are made. Read before starting work. -->

- ❌ `import { defineConfig } from "vite"` with `test` property → ✅ `import { defineConfig } from "vitest/config"` (Vite's own types don't include the `test` key; vitest/config re-exports defineConfig with test types)
- ❌ `pnpm test --run` exits with code 1 when no test files exist → ✅ This is expected Vitest behaviour; not a real failure
- ❌ `deno test` exits with code 1 when no test modules found → ✅ Expected Deno behaviour; not a real failure
- ❌ Assumed `@testing-library/react` auto-cleanup works with vitest forks pool → ✅ Add explicit `afterEach(() => { cleanup() })` in test files (auto-cleanup may not trigger reliably with vitest's default pool)

- ❌ `pnpm test --run` doubles the `--run` flag since package.json script already has `vitest --run` → ✅ Use `pnpm test` without extra flags

- ❌ `@libsql/client` on Windows needs `--allow-ffi` for native SQLite bindings → ✅ Add `--allow-ffi` to all deno run/test commands that use the DB client

- ❌ `applySchema` in migrate.ts filtered statements with `!s.startsWith("--")` after splitting on `;` — this dropped the first CREATE TABLE because the chunk started with SQL comments → ✅ Strip comment lines before splitting on semicolons

- ❌ `deno.json` compilerOptions `"lib": ["deno.ns", "deno.unstable"]` missing web globals (Request, Response, URL, Headers, console) → ✅ Add `"dom"` to lib array: `["deno.ns", "deno.unstable", "dom"]`
