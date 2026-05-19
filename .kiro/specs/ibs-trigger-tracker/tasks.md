# Implementation Plan: IBS Trigger Tracker

## Overview

Build a personal, mobile-first IBS trigger tracking web app with a React SPA frontend (Vite, Tailwind CSS, React Router) and Deno Deploy backend (TypeScript, Turso/libSQL, Claude Haiku 3.5). The implementation proceeds from backend infrastructure through data logging, AI features, frontend pages, and finally integration wiring.

## Tasks

- [ ] 1. Backend project setup and core infrastructure
  - [ ] 1.1 Initialise Deno backend project structure
    - Create `backend/` directory with `deno.json` (import map, tasks for dev/start/test)
    - Create `backend/main.ts` entry point with request routing skeleton
    - Create `backend/lib/cors.ts` CORS middleware that reads `CORS_ORIGIN` env var and enforces origin matching
    - Create `backend/lib/errors.ts` with standardised `ApiError` response helper (error code, message, optional fields)
    - Create `backend/lib/ulid.ts` ULID generation utility (Crockford Base32, 26 chars)
    - _Requirements: 12.3, 12.4_

  - [ ] 1.2 Set up Turso database client and schema
    - Create `backend/db/client.ts` initialising `@libsql/client` with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars
    - Create `backend/db/schema.sql` with all 5 tables (meal_logs, stool_logs, context_logs, symptom_logs, hypotheses) and indexes
    - Create `backend/db/queries.ts` with parameterised insert/select/delete functions for each table
    - _Requirements: 12.1, 12.4_

  - [ ] 1.3 Implement server-side validation utilities
    - Create `backend/lib/validate.ts` with validators for: numeric ranges, string lengths, enum membership, FODMAP flag subsets, array constraints
    - Each validator returns field-level error messages for the `ApiError.fields` map
    - _Requirements: 1.7, 1.8, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.2, 4.3_

  - [ ]* 1.4 Write property tests for validation utilities
    - **Property 2: Validation rejects out-of-range numeric fields**
    - **Property 3: Description length boundary enforcement**
    - **Property 4: Invalid enum values are rejected**
    - **Property 5: FODMAP flag subset acceptance**
    - **Validates: Requirements 1.2, 1.7, 1.8, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.2, 4.3**

  - [ ]* 1.5 Write property tests for ULID generation and CORS enforcement
    - **Property 14: All generated IDs are valid ULIDs and all timestamps are valid ISO8601**
    - **Property 10: CORS origin enforcement**
    - **Validates: Requirements 12.3, 12.4**

- [ ] 2. Backend CRUD route handlers
  - [ ] 2.1 Implement meal log route (`backend/routes/meals.ts`)
    - POST handler: validate request body (description required 1–500 chars, optional meal_type enum, fodmap_flags subset, ingredients array ≤50 items, portion_size enum, eating_speed enum), generate ULID + ISO8601 timestamp, insert into `meal_logs`, return 201 with full record
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ] 2.2 Implement stool log route (`backend/routes/stools.ts`)
    - POST handler: validate bristol_type (1–7 required), optional frequency (1–20), urgency (boolean), pain_score (0–10), blood (boolean), notes (≤1000 chars), generate ULID + timestamp, insert into `stool_logs`, return 201
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 2.3 Implement context log route (`backend/routes/context.ts`)
    - POST handler: validate all optional fields (stress 1–10, sleep_hours 0–24, sleep_quality 1–5, water 0–20, exercise_type enum, exercise_duration 0–1440, caffeine 0–2000, alcohol 0–50, menstrual_phase enum, medications ≤500 chars, notes ≤1000 chars), reject if any field invalid, persist if at least one valid field provided
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ] 2.4 Implement symptom log route (`backend/routes/symptoms.ts`)
    - POST handler: validate all 6 severity scores (0–10, all required), optional notes (≤1000 chars), generate ULID + timestamp, insert into `symptom_logs`, return 201
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.5 Write property test for log entry round-trip persistence
    - **Property 1: Log entry round-trip persistence**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 3.9, 4.1**

- [ ] 3. Checkpoint — Backend CRUD verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. AI integration layer
  - [ ] 4.1 Set up Anthropic SDK client (`backend/ai/client.ts`)
    - Initialise `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY` env var
    - Configure timeouts (15s for scan, 60s for review)
    - _Requirements: 6.11, 12.2_

  - [ ] 4.2 Implement ingredient scan prompt and route (`backend/ai/scan-prompt.ts`, `backend/routes/scan-ingredients.ts`)
    - POST handler: validate image_base64 (≤5MB decoded), mime_type (jpeg/png/gif/webp)
    - Build Claude vision prompt requesting structured JSON (description, ingredients, fodmap_flags, fodmap_detail, confidence, notes)
    - Parse and validate Claude response against ScanResponse schema
    - Return 200 with structured response; handle timeout (504) and unavailable (503)
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ] 4.3 Implement AI review prompt and route (`backend/ai/review-prompt.ts`, `backend/routes/review.ts`)
    - POST handler: query all logs up to 90 days, assemble prompt with log data
    - Send to Claude with 60s timeout
    - Parse response into ReviewResponse (summary, days_analysed, entries_analysed, hypotheses array)
    - DELETE existing hypothesis record, INSERT new one
    - Handle timeout (504) and failure (503) — preserve existing hypothesis on error
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.10, 6.11, 6.12_

  - [ ] 4.4 Implement confidence scoring logic (`backend/ai/confidence.ts`)
    - Confidence label assignment: Low (0.00–0.39), Moderate (0.40–0.64), High (0.65–0.84), Very High (0.85–0.95)
    - Data sufficiency caps: <7 days → max Low, <14 days → max Moderate
    - Supporting events cap: <3 events → max 0.50
    - Confounder reduction: stress ≥7, sleep_quality ≤2, water <1.0L → reduce by ≥0.15
    - _Requirements: 6.3, 6.7, 6.8, 6.9_

  - [ ] 4.5 Implement transit window correlation logic (`backend/ai/correlation.ts`)
    - Given meal logs and symptom logs, identify symptoms (any dimension ≥4) within 6–24 hours after a meal
    - Return correlated pairs for hypothesis generation
    - _Requirements: 6.2_

  - [ ]* 4.6 Write property tests for confidence scoring
    - **Property 7: Confidence label assignment**
    - **Property 8: Confidence caps based on data sufficiency and supporting events**
    - **Property 9: Confounder confidence reduction**
    - **Validates: Requirements 6.3, 6.7, 6.8, 6.9**

  - [ ]* 4.7 Write property test for transit window correlation
    - **Property 6: Transit window correlation correctness**
    - **Validates: Requirements 6.2**

  - [ ]* 4.8 Write property test for AI response schema validation
    - **Property 15: AI response schema validation**
    - **Validates: Requirements 5.2, 6.6**

- [ ] 5. Backend data export and hypotheses retrieval
  - [ ] 5.1 Implement hypotheses GET route (`backend/routes/hypotheses.ts`)
    - GET handler: fetch the single hypothesis record from DB, return 200 with ReviewResponse shape or empty state
    - _Requirements: 9.1, 9.2_

  - [ ] 5.2 Implement data export route (`backend/routes/export.ts`)
    - GET handler with `?format=json|csv` query param
    - JSON: single file with 5 keys (meal_logs, stool_logs, context_logs, symptom_logs, hypotheses), each an array of all records
    - CSV: one file per table with header row + data rows
    - Filename pattern: `ipoop-export-{format}-{YYYY-MM-DD}`
    - Empty tables produce empty array (JSON) or header-only file (CSV)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 5.3 Write property tests for export functionality
    - **Property 12: JSON export contains all persisted records**
    - **Property 13: CSV export produces valid files with correct headers**
    - **Property 16: Export filename pattern**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**

- [ ] 6. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend project setup and shared infrastructure
  - [ ] 7.1 Initialise React frontend project
    - Create `frontend/` with Vite + React 18 + TypeScript template via pnpm
    - Configure Tailwind CSS v3 (`tailwind.config.js`, PostCSS)
    - Set up React Router with all routes (/, /log/meal, /log/stool, /log/context, /log/symptoms, /history, /hypotheses, /settings)
    - Create `frontend/src/lib/types.ts` with shared TypeScript interfaces (matching API contracts)
    - _Requirements: 11.1, 11.3_

  - [ ] 7.2 Create API client and hooks
    - Create `frontend/src/lib/api.ts` — fetch wrapper using `VITE_API_BASE_URL`, JSON parsing, error mapping to user-friendly messages
    - Create `frontend/src/hooks/useApi.ts` — generic hook with loading/error/data states
    - Create `frontend/src/lib/validators.ts` — client-side form validation (mirrors backend rules)
    - _Requirements: 7.5, 11.4_

  - [ ] 7.3 Create shared UI components
    - `BottomNav.tsx` — fixed bottom nav with 5 items (Home, Meal, Stool, Context, Symptoms), icon + label, equal spacing, 44px min tap targets
    - `LoadingSpinner.tsx` — loading state indicator
    - `Disclaimer.tsx` — medical disclaimer component (footer + contextual variants)
    - `QuickLogButton.tsx` — reusable quick-log action button (44px min)
    - _Requirements: 11.1, 11.2, 11.5, 13.1, 13.2_

- [ ] 8. Frontend logging pages
  - [ ] 8.1 Implement Meal Log page (`MealLogPage.tsx`)
    - Form with: description (required, max 500), meal_type select, FODMAP multi-select checkboxes (F/O/D/M/P), portion_size select, eating_speed select
    - Photo capture button triggering ingredient scan flow
    - `PhotoCapture.tsx` — camera/file input (validate type + 5MB size)
    - `FodmapCheckboxes.tsx` — multi-select FODMAP picker
    - `IngredientBreakdown.tsx` — expandable scan results
    - On scan success: pre-populate description, tick FODMAP flags, show ingredient breakdown
    - On submit: POST to /api/meals, navigate to dashboard
    - _Requirements: 1.1–1.8, 5.1, 5.3, 5.4, 5.8, 5.9, 11.4, 13.3_

  - [ ] 8.2 Implement Stool Log page (`StoolLogPage.tsx`)
    - Form with: Bristol type picker (1–7, required), frequency, urgency toggle, pain score (0–10), blood toggle, notes
    - `BristolPicker.tsx` — visual Bristol scale 1–7 selector
    - On submit: POST to /api/stools, navigate to dashboard
    - _Requirements: 2.1–2.4, 11.4_

  - [ ] 8.3 Implement Context Log page (`ContextLogPage.tsx`)
    - Form with all optional fields: stress (1–10), sleep hours, sleep quality (1–5), water litres, exercise type select, exercise duration, caffeine mg, alcohol units, medications, menstrual phase select, notes
    - All fields optional but at least one required for submission
    - On submit: POST to /api/context, navigate to dashboard
    - _Requirements: 3.1–3.9, 11.4_

  - [ ] 8.4 Implement Symptom Log page (`SymptomLogPage.tsx`)
    - Form with 6 required severity sliders (0–10): bloating, cramping, nausea, urgency, fatigue, overall
    - `SeveritySlider.tsx` — 0–10 severity input component
    - Optional notes field (max 1000 chars)
    - On submit: POST to /api/symptoms, navigate to dashboard, show success confirmation
    - _Requirements: 4.1–4.5, 11.4_

- [ ] 9. Frontend dashboard, history, hypotheses, and settings pages
  - [ ] 9.1 Implement Dashboard page (`DashboardPage.tsx`)
    - Display today's log count, most recent symptom overall score, most recent Bristol type
    - Hypothesis teaser card (highest confidence trigger name, FODMAP category, confidence score)
    - Quick-log buttons for all 4 loggers
    - Empty state placeholders when no data exists
    - CTA to run AI review when no hypotheses exist
    - `useDashboardSummary.ts` hook for data fetching
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 9.2 Implement History page (`HistoryPage.tsx`)
    - Scrollable list grouped by day (reverse chronological), date headings
    - `LogEntryCard.tsx` — type indicator + summary (meal: description + FODMAP; stool: Bristol + pain; context: stress + sleep; symptom: overall)
    - Initial load: 14 days; infinite scroll loads next 7 days per batch
    - `useInfiniteHistory.ts` hook for paginated loading
    - Empty state when no entries exist
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 9.3 Write property test for history grouping logic
    - **Property 11: History entries are grouped by day in reverse chronological order**
    - **Validates: Requirements 8.1**

  - [ ] 9.4 Implement Hypotheses page (`HypothesesPage.tsx`)
    - Display AI summary paragraph above hypothesis cards
    - `HypothesisCard.tsx` — trigger name, FODMAP category, confidence score + visual badge + label, direction, symptom pattern, supporting/contradicting counts
    - `ConfidenceBadge.tsx` — visual confidence indicator (colour-coded by label)
    - "Run AI Review" button with loading state (disable + spinner during request)
    - Last review date and entries analysed count
    - Empty state with prompt to run first review
    - Error state with retry on failure
    - Contextual AI disclaimer
    - _Requirements: 9.1–9.6, 13.3_

  - [ ] 9.5 Implement Settings page (`SettingsPage.tsx`)
    - Data export section with JSON/CSV format selection
    - Export button triggers GET /api/export?format=json|csv and initiates file download
    - _Requirements: 10.1–10.5_

- [ ] 10. Checkpoint — Frontend pages complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration wiring and final polish
  - [ ] 11.1 Wire backend router to all route handlers
    - Update `backend/main.ts` to import and dispatch to all route handlers (meals, stools, context, symptoms, scan-ingredients, review, hypotheses, export)
    - Ensure CORS middleware runs on every request
    - Ensure error handler wraps all routes with consistent ApiError responses
    - _Requirements: 12.3, 12.6_

  - [ ] 11.2 Wire frontend routing and layout
    - Ensure all pages render within a layout that includes BottomNav and footer Disclaimer
    - Verify navigation flow: bottom nav → form → submit → dashboard (≤3 taps)
    - Single-column layout for viewports ≤768px
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2_

  - [ ]* 11.3 Write frontend component unit tests
    - Test BottomNav rendering and navigation
    - Test form validation feedback on logging pages
    - Test empty states and placeholders on Dashboard and History
    - Test Disclaimer presence on all pages
    - _Requirements: 7.2, 8.4, 11.1, 13.1, 13.2_

- [ ] 12. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend uses Deno test runner + fast-check for property tests
- Frontend uses Vitest + React Testing Library + fast-check for property tests
- All IDs are ULIDs, all timestamps are ISO8601
- Images are never persisted — only extracted data is stored

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "4.1", "7.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "7.2", "7.3"] },
    { "id": 5, "tasks": ["4.6", "4.7", "4.8", "5.1", "5.2", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["5.3", "9.1", "9.2", "9.4", "9.5"] },
    { "id": 7, "tasks": ["9.3", "11.1", "11.2"] },
    { "id": 8, "tasks": ["11.3"] }
  ]
}
```
