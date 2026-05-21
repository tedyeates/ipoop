# Implementation Plan: IBS Trigger Tracker

## Overview

Build a personal, mobile-first IBS trigger tracking web app with a React SPA frontend (Vite, Tailwind CSS, React Router) and Deno Deploy backend (TypeScript, SQLite locally / Turso in production, Claude Haiku 3.5). The implementation proceeds **frontend-first** — all pages are built against dummy data and a mock API layer so the UI can be reviewed and approved before any backend work begins.

## Strategy

1. **Phase 1 (Frontend):** Build the complete React SPA with a local mock data layer (no network calls). All forms, pages, navigation, and visual states are functional against in-memory dummy data. Component tests verify rendering with different data.
2. **Phase 2 (Backend):** Once the frontend is approved, build the Deno backend using local SQLite for development and testing. AI responses are mocked in tests (user tests AI manually). All other tests run against real local infrastructure — no mocking unless there's no alternative.
3. **Phase 3 (Integration):** Wire frontend to backend, final polish. Turso swap happens at deployment time (same libSQL interface, just a config change).

---

## Tasks

### Phase 0 — Prerequisites

- [X] 0. Verify and install all prerequisites
  - [X] 0.1 Verify pnpm is installed and available
  - [X] 0.2 Verify Deno is installed and available
  - [X] 0.3 Verify Node.js is installed (required for pnpm/Vite)
  - [X] 0.4 Create frontend project and install all frontend dependencies in one step
  - [X] 0.5 Create backend project and install/cache all backend dependencies
  - [X] 0.6 Confirm all tools work together

---

### Phase 1 — Frontend (Dummy Data)

- [X] 1. Frontend project setup
  - [X] 1.1 Configure frontend project structure
    - Configure Tailwind CSS v3 (`tailwind.config.js`, PostCSS) — deps already installed in 0.4
    - Set up React Router with all routes (/, /log/meal, /log/stool, /log/context, /log/symptoms, /history, /hypotheses, /settings)
    - Create `frontend/src/lib/types.ts` with shared TypeScript interfaces (matching API contracts from design doc)
    - Configure Vitest in `vite.config.ts` (jsdom environment, setup file for testing-library matchers)
    - _Requirements: 11.1, 11.3_

  - [X] 1.2 Create mock data layer
    - Create `frontend/src/mocks/data.ts` — seed dummy data for all 4 log types + hypotheses (realistic sample entries covering various states)
    - Create `frontend/src/mocks/api.ts` — mock API functions that read/write to an in-memory store (simulates POST/GET with realistic delays)
    - Mock functions: `createMeal`, `createStool`, `createContext`, `createSymptom`, `getMeals`, `getStools`, `getContext`, `getSymptoms`, `getHypotheses`, `runReview`, `scanIngredients`, `exportData`
    - All mock functions return the same response shapes as the real API contracts
    - Include simulated loading delays (300–800ms) to test loading states
    - _Requirements: all logging + retrieval requirements_

  - [X] 1.3 Create API client abstraction
    - Create `frontend/src/lib/api.ts` — exports the same interface regardless of whether mocks or real backend are used
    - Create `frontend/src/hooks/useApi.ts` — generic hook with loading/error/data states
    - Use an environment flag (`VITE_USE_MOCKS=true`) to toggle between mock and real implementations
    - Create `frontend/src/lib/validators.ts` — client-side form validation (mirrors backend rules)
    - _Requirements: 7.5, 11.4_

- [ ] 2. Shared UI components
  - [ ] 2.1 Create layout and navigation components
    - `BottomNav.tsx` — fixed bottom nav with 5 items (Home, Meal, Stool, Context, Symptoms), icon + label, equal spacing, 44px min tap targets
    - `AppLayout.tsx` — wraps all pages with BottomNav and footer Disclaimer
    - `Disclaimer.tsx` — medical disclaimer component (footer + contextual variants)
    - `LoadingSpinner.tsx` — loading state indicator
    - _Requirements: 11.1, 11.2, 11.5, 13.1, 13.2_

  - [ ] 2.2 Create form input components
    - `QuickLogButton.tsx` — reusable quick-log action button (44px min)
    - `FodmapCheckboxes.tsx` — multi-select FODMAP category picker (F/O/D/M/P)
    - `BristolPicker.tsx` — visual Bristol scale 1–7 selector
    - `SeveritySlider.tsx` — 0–10 severity input component
    - `PhotoCapture.tsx` — camera/file input (validate type + 5MB size)
    - _Requirements: 1.2, 2.1, 4.1, 5.1_

  - [ ] 2.3 Create display components
    - `HypothesisCard.tsx` — trigger name, FODMAP category, confidence score + visual badge + label, direction, symptom pattern, supporting/contradicting counts
    - `ConfidenceBadge.tsx` — visual confidence indicator (colour-coded by label: Low/Moderate/High/Very High)
    - `LogEntryCard.tsx` — type indicator + summary (meal: description + FODMAP; stool: Bristol + pain; context: stress + sleep; symptom: overall)
    - `IngredientBreakdown.tsx` — expandable scan results display
    - _Requirements: 8.2, 9.1, 9.2_

- [ ] 3. Frontend logging pages
  - [ ] 3.1 Implement Meal Log page (`MealLogPage.tsx`)
    - Form with: description (required, max 500), meal_type select, FODMAP multi-select checkboxes, portion_size select, eating_speed select
    - Photo capture button triggering mock ingredient scan flow
    - On scan success: pre-populate description, tick FODMAP flags, show ingredient breakdown
    - Client-side validation with inline error messages
    - On submit: call mock API, show success feedback, navigate to dashboard
    - _Requirements: 1.1–1.8, 5.1, 5.3, 5.4, 5.8, 5.9, 11.4, 13.3_

  - [ ] 3.2 Implement Stool Log page (`StoolLogPage.tsx`)
    - Form with: Bristol type picker (1–7, required), frequency, urgency toggle, pain score (0–10), blood toggle, notes
    - Client-side validation
    - On submit: call mock API, navigate to dashboard
    - _Requirements: 2.1–2.4, 11.4_

  - [ ] 3.3 Implement Context Log page (`ContextLogPage.tsx`)
    - Form with all optional fields: stress (1–10), sleep hours, sleep quality (1–5), water litres, exercise type select, exercise duration, caffeine mg, alcohol units, medications, menstrual phase select, notes
    - All fields optional but at least one required for submission
    - On submit: call mock API, navigate to dashboard
    - _Requirements: 3.1–3.9, 11.4_

  - [ ] 3.4 Implement Symptom Log page (`SymptomLogPage.tsx`)
    - Form with 6 required severity sliders (0–10): bloating, cramping, nausea, urgency, fatigue, overall
    - Optional notes field (max 1000 chars)
    - On submit: call mock API, navigate to dashboard, show success confirmation
    - _Requirements: 4.1–4.5, 11.4_

- [ ] 4. Frontend data pages
  - [ ] 4.1 Implement Dashboard page (`DashboardPage.tsx`)
    - Display today's log count, most recent symptom overall score, most recent Bristol type
    - Hypothesis teaser card (highest confidence trigger name, FODMAP category, confidence score)
    - Quick-log buttons for all 4 loggers
    - Empty state placeholders when no data exists
    - CTA to run AI review when no hypotheses exist
    - `useDashboardSummary.ts` hook for data fetching (from mock layer)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 4.2 Implement History page (`HistoryPage.tsx`)
    - Scrollable list grouped by day (reverse chronological), date headings
    - Uses `LogEntryCard.tsx` for each entry
    - Initial load: 14 days; infinite scroll loads next 7 days per batch
    - `useInfiniteHistory.ts` hook for paginated loading (from mock layer)
    - Empty state when no entries exist
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 4.3 Implement Hypotheses page (`HypothesesPage.tsx`)
    - Display AI summary paragraph above hypothesis cards
    - Uses `HypothesisCard.tsx` and `ConfidenceBadge.tsx`
    - "Run AI Review" button with loading state (disable + spinner during mock request)
    - Last review date and entries analysed count
    - Empty state with prompt to run first review
    - Error state with retry on failure
    - Contextual AI disclaimer
    - _Requirements: 9.1–9.6, 13.3_

  - [ ] 4.4 Implement Settings page (`SettingsPage.tsx`)
    - Data export section with JSON/CSV format selection
    - Export button triggers mock export and initiates file download
    - _Requirements: 10.1–10.5_

- [ ] 5. Frontend component tests
  - [ ] 5.1 Write component display tests for shared components
    - `BottomNav` — renders all 5 nav items with correct labels and icons, highlights active route
    - `Disclaimer` — renders disclaimer text in both footer and contextual variants
    - `LoadingSpinner` — renders spinner element
    - `QuickLogButton` — renders with label, meets 44px min size
    - `FodmapCheckboxes` — renders all 5 FODMAP options, shows checked state for pre-selected values, shows unchecked for empty
    - `BristolPicker` — renders all 7 options, highlights selected value, shows nothing selected for undefined
    - `SeveritySlider` — renders with label, displays current value (0, 5, 10), shows min/max labels
    - `ConfidenceBadge` — renders correct label and colour for each confidence level (Low/Moderate/High/Very High)
    - `HypothesisCard` — renders trigger name, FODMAP category, confidence score, direction, supporting/contradicting counts; handles missing optional fields
    - `LogEntryCard` — renders correctly for each log type (meal with FODMAP flags, stool with Bristol type, context with stress/sleep, symptom with overall score)
    - `IngredientBreakdown` — renders ingredient list, FODMAP detail, expands/collapses

  - [ ] 5.2 Write component display tests for page components
    - `DashboardPage` — renders with data (log counts, hypothesis teaser, quick-log buttons); renders empty state (no logs, no hypotheses, CTA visible)
    - `HistoryPage` — renders grouped entries by day with date headings; renders empty state
    - `HypothesesPage` — renders with hypothesis data (summary, cards, last review date); renders empty state (prompt to run review); renders loading state; renders error state with retry
    - `SettingsPage` — renders export format options and export button
    - `MealLogPage` — renders all form fields; shows validation errors for empty required fields; shows scan results when populated
    - `StoolLogPage` — renders Bristol picker and all fields; shows validation error when no Bristol type selected
    - `ContextLogPage` — renders all optional fields; shows error when submitting with no fields filled
    - `SymptomLogPage` — renders all 6 severity sliders; shows validation errors when sliders not set

- [ ] 6. Checkpoint — Frontend review
  - All pages functional against mock data
  - All component tests pass
  - Navigation flows work end-to-end (≤3 taps from icon to submission)
  - Mobile-first layout verified (single-column ≤768px)
  - Loading states, error states, and empty states all visible
  - **User approves frontend before proceeding to Phase 2**

---

### Phase 2 — Backend (Local SQLite)

- [ ] 7. Backend project setup and core infrastructure
  - [ ] 7.1 Initialise Deno backend project structure
    - Create `backend/` directory with `deno.json` (import map, tasks for dev/start/test)
    - Create `backend/main.ts` entry point with request routing skeleton
    - Create `backend/lib/cors.ts` CORS middleware that reads `CORS_ORIGIN` env var
    - Create `backend/lib/errors.ts` with standardised `ApiError` response helper
    - Create `backend/lib/ulid.ts` ULID generation utility
    - _Requirements: 12.3, 12.4_

  - [ ] 7.2 Set up database client and schema (local SQLite)
    - Create `backend/db/client.ts` using `@libsql/client` — in development, connect to a local SQLite file (`data/local.db`); in production, connect to Turso via env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
    - Use an env var (`DATABASE_MODE=local|turso`) to switch between local file and remote Turso
    - Create `backend/db/schema.sql` with all 5 tables and indexes
    - Create `backend/db/migrate.ts` — applies schema.sql to the configured database (works for both local and Turso)
    - Create `backend/db/queries.ts` with parameterised insert/select/delete functions
    - _Requirements: 12.1, 12.4_

  - [ ] 7.3 Implement server-side validation utilities
    - Create `backend/lib/validate.ts` with validators for all field types
    - _Requirements: 1.7, 1.8, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.2, 4.3_

- [ ] 8. Backend CRUD route handlers
  - [ ] 8.1 Implement meal log route (`backend/routes/meals.ts`)
    - POST handler with full validation, ULID + timestamp generation, DB insert
    - GET handler to retrieve meals (with optional `since` timestamp filter)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ] 8.2 Implement stool log route (`backend/routes/stools.ts`)
    - POST handler with validation, ULID + timestamp, DB insert
    - GET handler to retrieve stool logs
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 8.3 Implement context log route (`backend/routes/context.ts`)
    - POST handler with validation (all optional, at least one required), DB insert
    - GET handler to retrieve context logs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ] 8.4 Implement symptom log route (`backend/routes/symptoms.ts`)
    - POST handler with validation (all 6 required), DB insert
    - GET handler to retrieve symptom logs
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Backend tests — CRUD and validation (local SQLite, no mocks)
  - [ ] 9.1 Write tests for validation utilities (`backend/tests/lib/validate_test.ts`)
    - Test every numeric range validator with values at boundaries (min, max, min-1, max+1)
    - Test string length validators (empty, 1 char, max, max+1, whitespace-only)
    - Test enum validators with every valid value + representative invalid values
    - Test FODMAP flag subset validation (all valid subsets, invalid characters)
    - Test compound validation (multiple fields invalid simultaneously)
    - All tests run against real validation functions — no mocking
    - _Requirements: 1.7, 1.8, 2.2, 2.3, 2.4, 3.3–3.8, 4.2, 4.3_

  - [ ] 9.2 Write tests for database queries (`backend/tests/db/queries_test.ts`)
    - Each test gets a fresh local SQLite database (created in a temp file, schema applied)
    - Test insert + select round-trip for all 4 log tables (verify all fields preserved)
    - Test `since` parameter filtering returns only records after the given timestamp
    - Test descending order (most recent first) on all getters
    - Test null preservation for optional fields across all tables
    - Test `upsertHypothesis` single-row invariant (second upsert overwrites first)
    - Test `getHypothesis` returns null on empty table
    - Test `deleteHypothesis` removes the record
    - All tests use real SQLite — no mocking of the database layer
    - _Requirements: 12.1, 12.4_

  - [ ] 9.3 Write tests for route handlers (`backend/tests/routes/`)
    - Tests call route handlers directly with constructed Request objects (no HTTP server needed)
    - Each test uses a real local SQLite database (fresh per test)
    - Test each route (meals, stools, context, symptoms) for:
      - Valid payload → 201 with correct response shape and all fields persisted
      - Missing required fields → 400 with field-level errors
      - Out-of-range values → 400 with field-level errors
      - Invalid enum values → 400 with field-level errors
      - Non-POST/GET methods → 405
      - Invalid JSON body → 400 INVALID_JSON error
      - Boundary conditions (empty strings, max-length strings, edge numeric values)
    - No mocking — tests exercise the full stack from request → validation → DB → response
    - _Requirements: 1.7, 1.8, 2.2, 2.3, 2.4, 3.3–3.8, 4.2, 4.3, 12.6_

  - [ ] 9.4 Write tests for ULID generation and CORS
    - Test ULID format (26 chars, Crockford Base32, lexicographically sortable)
    - Test ULID uniqueness (generate 1000, all distinct)
    - Test CORS allows matching origin, rejects non-matching origin
    - Test CORS preflight (OPTIONS) returns correct headers
    - No mocking needed — these are pure functions / simple middleware
    - _Requirements: 12.3, 12.4_

- [ ] 10. AI integration layer
  - [ ] 10.1 Set up Anthropic SDK client (`backend/ai/client.ts`)
    - Initialise with `ANTHROPIC_API_KEY`, configure timeouts (15s scan, 60s review)
    - _Requirements: 6.11, 12.2_

  - [ ] 10.2 Implement ingredient scan prompt and route
    - POST handler: validate image (type + 5MB size), send to Claude vision, parse structured response
    - Response parsing validates against ScanResponse schema
    - Handle timeout (504) and unavailable (503)
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ] 10.3 Implement AI review prompt and route
    - POST handler: query all logs (up to 90 days) from local SQLite, assemble prompt, send to Claude, parse response
    - Parse into ReviewResponse (summary, days_analysed, entries_analysed, hypotheses array)
    - DELETE existing hypothesis, INSERT new one
    - Handle timeout (504) and failure (503) — preserve existing hypothesis on error
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.10, 6.11, 6.12_

  - [ ] 10.4 Implement confidence scoring and transit window correlation
    - `backend/ai/confidence.ts` — confidence label assignment, data sufficiency caps, confounder reduction
    - `backend/ai/correlation.ts` — transit window correlation (6–24hr between meal and symptom)
    - These are pure functions with no external dependencies
    - _Requirements: 6.2, 6.3, 6.7, 6.8, 6.9_

- [ ] 11. Backend tests — AI layer
  - [ ] 11.1 Write tests for confidence scoring (`backend/tests/ai/confidence_test.ts`)
    - Test label assignment for scores at each boundary (0.00, 0.39, 0.40, 0.64, 0.65, 0.84, 0.85, 0.95)
    - Test data sufficiency caps (<7 days → max Low, <14 days → max Moderate)
    - Test supporting events cap (<3 events → max 0.50)
    - Test confounder reduction (stress ≥7, sleep_quality ≤2, water <1.0L → reduce by ≥0.15)
    - Test combinations of caps and confounders
    - No mocking — these are pure functions
    - _Requirements: 6.3, 6.7, 6.8, 6.9_

  - [ ] 11.2 Write tests for transit window correlation (`backend/tests/ai/correlation_test.ts`)
    - Test symptom within 6–24hr window after meal → correlated
    - Test symptom before 6hr → not correlated
    - Test symptom after 24hr → not correlated
    - Test symptom at exact boundaries (6hr, 24hr)
    - Test symptom threshold (dimension ≥4 triggers correlation, <4 does not)
    - Test multiple meals and symptoms with overlapping windows
    - No mocking — pure function with timestamp inputs
    - _Requirements: 6.2_

  - [ ] 11.3 Write tests for AI response parsing (`backend/tests/ai/parsers_test.ts`)
    - Test valid ScanResponse JSON → parsed correctly
    - Test valid ReviewResponse JSON → parsed correctly
    - Test malformed JSON → structured error (not crash)
    - Test missing required fields → structured error
    - Test extra fields → ignored gracefully
    - Test invalid types within otherwise valid structure → error
    - No mocking — tests the parser functions directly with crafted JSON strings
    - _Requirements: 5.2, 6.6_

  - [ ] 11.4 Write tests for scan and review routes (`backend/tests/routes/ai_routes_test.ts`)
    - **Mock only the Anthropic SDK client** (the only thing we can't run locally)
    - Test scan route: valid image → mock Claude returns valid ScanResponse → route returns 200 with parsed data
    - Test scan route: invalid image type → 422 before Claude is called
    - Test scan route: image too large → 422 before Claude is called
    - Test scan route: Claude timeout → 504 response
    - Test scan route: Claude unavailable → 503 response
    - Test scan route: Claude returns malformed JSON → 500 with parse error
    - Test review route: logs exist in DB → mock Claude returns valid ReviewResponse → hypothesis persisted in DB → 200
    - Test review route: Claude fails → existing hypothesis preserved → error response
    - Test review route: no logs → appropriate response
    - Uses real local SQLite for DB operations, mocks only the Claude API call
    - _Requirements: 5.1–5.9, 6.1–6.12_

- [ ] 12. Backend data export and hypotheses retrieval
  - [ ] 12.1 Implement hypotheses GET route
    - _Requirements: 9.1, 9.2_

  - [ ] 12.2 Implement data export route (JSON + CSV)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 12.3 Write tests for export and hypotheses routes (`backend/tests/routes/export_test.ts`)
    - Test JSON export with data in all tables → correct structure with all records
    - Test JSON export with empty tables → empty arrays
    - Test CSV export → valid files with correct headers and data rows
    - Test CSV export with empty tables → header-only output
    - Test export filename pattern matches `ipoop-export-{format}-{YYYY-MM-DD}`
    - Test hypotheses GET with existing record → returns full ReviewResponse shape
    - Test hypotheses GET with no record → returns empty state
    - All tests use real local SQLite with seeded data — no mocking
    - _Requirements: 10.1–10.5, 9.1, 9.2_

- [ ] 13. Checkpoint — Backend complete
  - All backend tests pass against local SQLite
  - All routes functional
  - Ask user if questions arise

---

### Phase 3 — Integration

- [ ] 14. Wire frontend to real backend
  - [ ] 14.1 Switch API client from mocks to real backend
    - Set `VITE_USE_MOCKS=false`, configure `VITE_API_BASE_URL`
    - Verify all pages work against real local backend
    - _Requirements: 11.4_

  - [ ] 14.2 Wire backend router to all route handlers
    - Update `backend/main.ts` to dispatch to all routes with CORS + error handling
    - _Requirements: 12.3, 12.6_

  - [ ] 14.3 End-to-end verification
    - Verify navigation flow: bottom nav → form → submit → dashboard (≤3 taps)
    - Verify loading/error states with real network latency
    - Verify AI scan and review flows end-to-end (manual)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2_

- [ ] 15. Final checkpoint — All working
  - Full app functional end-to-end against local SQLite
  - All tests pass
  - Ready for cloud deployment (swap `DATABASE_MODE=turso` + set Turso env vars)
  - Ask user if questions arise

---

## Notes

- **Frontend-first approach:** All UI is built and reviewable before any backend code exists. The mock data layer simulates realistic API behaviour including loading delays and error states.
- **Mock/real toggle:** A single env var (`VITE_USE_MOCKS`) switches between mock and real API. The API client interface is identical in both modes.
- **Local SQLite for development:** Backend uses a local SQLite file (`backend/data/local.db`) during development and testing. Same `@libsql/client` interface works for both local SQLite and remote Turso — switching is a config change (`DATABASE_MODE=local|turso`).
- **Mocking philosophy:** Only mock what cannot be run locally. The Anthropic Claude API is the only external dependency that gets mocked in tests. Database operations, validation, CORS, routing — all tested against real implementations.
- **AI tested manually:** The user will test actual Claude API integration manually. Automated tests verify the surrounding logic (parsing, error handling, routing) with mocked Claude responses.
- **Frontend tests are display-focused:** Component tests verify that components render correctly with different data inputs (populated, empty, edge cases). No logic or integration testing on the frontend — that's covered by backend tests.
- **Dummy data is realistic:** Mock data includes edge cases (empty states, max-length strings, all FODMAP combinations, various Bristol types, high/low confidence hypotheses) so the UI can be stress-tested visually.
- Each task references specific requirements for traceability
- All IDs are ULIDs, all timestamps are ISO8601
- Images are never persisted — only extracted data is stored

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1", "0.2", "0.3"] },
    { "id": 1, "tasks": ["0.4", "0.5"] },
    { "id": 2, "tasks": ["0.6"] },
    { "id": 3, "tasks": ["1.1"] },
    { "id": 4, "tasks": ["1.2", "1.3"] },
    { "id": 5, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 6, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 7, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 8, "tasks": ["5.1", "5.2"] },
    { "id": 9, "tasks": ["7.1"] },
    { "id": 10, "tasks": ["7.2", "7.3"] },
    { "id": 11, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 12, "tasks": ["9.1", "9.2", "9.3", "9.4"] },
    { "id": 13, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 14, "tasks": ["11.1", "11.2", "11.3", "11.4"] },
    { "id": 15, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 16, "tasks": ["14.1", "14.2"] },
    { "id": 17, "tasks": ["14.3"] }
  ]
}
```
