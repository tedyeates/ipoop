# IBS Trigger Tracker — Project Specification

## Overview

A personal, mobile-first web application for logging food intake and bowel health data, then using AI to identify probable IBS triggers with confidence ratings. Hypotheses are stored and overwritten on each AI review cycle.

This is a solo-use personal health tool. There is no multi-user auth requirement for v1 — a single hardcoded user is acceptable.

---

## Stack

| Layer | Technology | Rationale |
|---|---|---|
| Package manager | pnpm | Fast, disk-efficient, strict hoisting |
| Frontend | React 18 + Vite | Mobile-first SPA, fast dev cycle |
| Styling | Tailwind CSS v3 | Utility-first, works well mobile |
| Backend API | Deno Deploy (edge functions) | Free tier, zero cold starts, TypeScript-native |
| Database | Turso (libSQL / SQLite) | Free tier generous for personal use, simple schema, zero ops |
| AI | Anthropic Claude Haiku 3.5 | Cheapest capable model, triggered on-demand |
| Frontend hosting | Vercel | Free, instant deploys from GitHub |
| Backend hosting | Deno Deploy | Paired with backend |

> **Package manager note**: Use `pnpm` throughout. Initialise with `pnpm create vite@latest`. Vercel supports pnpm natively — set build command to `pnpm build` and install command to `pnpm install` in the Vercel project settings. Do not commit a `package-lock.json` or `yarn.lock`; the presence of `pnpm-lock.yaml` is the canonical lockfile.

---

## Core Models

### Bristol Stool Scale (1–7)
- Types 1–2: Constipation
- Types 3–4: Normal / Ideal
- Types 5–7: Loose / Diarrhoea
- Log type + frequency per day + urgency (yes/no) + pain score (0–10)

### FODMAP Categories
Track which of the following are present in each meal:
- **F** — Fructans (wheat, onion, garlic, rye)
- **O** — GOS / Galacto-oligosaccharides (legumes, lentils, chickpeas)
- **D** — Lactose (milk, soft cheese, ice cream)
- **M** — Excess fructose (mango, apple, honey, HFCS)
- **P** — Polyols (stone fruits, avocado, mushroom, sorbitol, xylitol)

Each meal log should allow multi-select of FODMAP categories present, plus portion size. FODMAP flags can be populated automatically via the ingredient photo scan flow (see Ingredient Photo Scanning below) or set manually.

---

## Data Model

### Table: `meal_logs`
```sql
id                   TEXT PRIMARY KEY  -- ulid
logged_at            TEXT NOT NULL     -- ISO8601 datetime
meal_type            TEXT              -- breakfast | lunch | dinner | snack
description          TEXT NOT NULL     -- free text description of meal
ingredients_raw      TEXT              -- JSON array of ingredient strings extracted by AI
fodmap_flags         TEXT              -- JSON array: ["F","O","M"] etc.
fodmap_ingredients   TEXT              -- JSON object: {"F": ["onion","garlic"], "M": ["apple"]}
portion_size         TEXT              -- small | medium | large
eating_speed         TEXT              -- slow | normal | fast
scan_used            INTEGER           -- 0 or 1: whether photo scan was used for this entry
notes                TEXT              -- optional free text
```

### Table: `stool_logs`
```sql
id             TEXT PRIMARY KEY  -- ulid
logged_at      TEXT NOT NULL     -- ISO8601 datetime
bristol_type   INTEGER NOT NULL  -- 1–7
frequency      INTEGER           -- number of times today (log per event or daily summary)
urgency        INTEGER           -- 0 or 1 boolean
pain_score     INTEGER           -- 0–10
blood          INTEGER           -- 0 or 1 (flag for awareness; recommend GP if recurring)
notes          TEXT
```

### Table: `context_logs`
```sql
id             TEXT PRIMARY KEY  -- ulid
logged_at      TEXT NOT NULL     -- ISO8601 datetime (date portion used for daily grouping)
stress_score   INTEGER           -- 1–10
sleep_hours    REAL              -- e.g. 7.5
sleep_quality  INTEGER           -- 1–5
water_litres   REAL              -- e.g. 2.0
exercise_type  TEXT              -- none | walk | gym | run | other
exercise_mins  INTEGER
caffeine_mg    INTEGER           -- approximate mg (espresso ~63mg, filter ~95mg, tea ~40mg)
alcohol_units  REAL              -- UK units
medications    TEXT              -- free text: "ibuprofen 400mg" etc.
menstrual_phase TEXT             -- follicular | ovulatory | luteal | menstrual | n/a
notes          TEXT
```

### Table: `symptom_logs`
```sql
id             TEXT PRIMARY KEY  -- ulid
logged_at      TEXT NOT NULL     -- ISO8601 datetime
bloating       INTEGER           -- 0–10
cramping       INTEGER           -- 0–10
nausea         INTEGER           -- 0–10
urgency        INTEGER           -- 0–10
fatigue        INTEGER           -- 0–10
overall_score  INTEGER           -- 0–10 (how bad is today overall)
notes          TEXT
```

### Table: `hypotheses`
```sql
id             TEXT PRIMARY KEY  -- ulid
generated_at   TEXT NOT NULL     -- ISO8601 datetime of last AI review
data_window    TEXT              -- e.g. "2025-01-01 to 2025-01-31"
entry_count    INTEGER           -- how many log entries were analysed
hypotheses     TEXT NOT NULL     -- JSON array (see Hypothesis schema below)
ai_summary     TEXT              -- plain-English summary paragraph from AI
model_used     TEXT              -- e.g. "claude-haiku-4-5"
```

#### Hypothesis JSON schema (stored in `hypotheses.hypotheses`):
```json
[
  {
    "id": "h1",
    "trigger": "Onion / garlic (fructans)",
    "fodmap_category": "F",
    "confidence": 0.82,
    "confidence_label": "High",
    "direction": "worsens",
    "symptom_pattern": "Bloating and cramping 8–14hrs after meals containing fructans",
    "supporting_events": 7,
    "contradicting_events": 1,
    "notes": "Effect appears dose-dependent — small amounts tolerated better"
  }
]
```

**confidence_label mapping:**
- 0.0–0.39: Low
- 0.40–0.64: Moderate  
- 0.65–0.84: High
- 0.85–1.0: Very High

---

## Ingredient Photo Scanning

### Overview
On the meal log form, the user can optionally tap a camera/photo button to photograph their meal, ingredients label, or a menu. The image is sent to the Deno backend, which passes it to Claude's vision API. Claude identifies all visible ingredients and classifies each one against the five FODMAP categories. The result is returned to the frontend, which pre-populates the FODMAP flags and shows the ingredient list for the user to confirm or edit before saving.

### UX Flow
1. User opens `/log/meal`
2. Taps "Scan ingredients" button (camera icon)
3. Device native camera or photo picker opens (`<input type="file" accept="image/*" capture="environment">`)
4. Image selected/taken → frontend converts to base64
5. Frontend posts `{ image_base64, mime_type }` to `/api/scan-ingredients`
6. Backend calls Claude vision API with image + system prompt
7. Backend returns structured JSON: ingredient list + FODMAP classifications
8. Frontend pre-populates:
   - `description` field with a comma-joined ingredient summary (editable)
   - FODMAP category checkboxes (pre-ticked, editable)
   - Expandable ingredient breakdown showing which ingredient triggered which flag
9. User reviews, edits if needed, then saves as normal

### Backend endpoint: `POST /api/scan-ingredients`

**Request:**
```json
{
  "image_base64": "...",
  "mime_type": "image/jpeg"
}
```

**Response:**
```json
{
  "description": "Pasta, tomato sauce, garlic, onion, parmesan",
  "ingredients": ["pasta", "tomato sauce", "garlic", "onion", "parmesan"],
  "fodmap_flags": ["F", "D"],
  "fodmap_ingredients": {
    "F": ["garlic", "onion"],
    "D": ["parmesan"]
  },
  "confidence": "high",
  "notes": "Parmesan is low-lactose but technically contains trace lactose — flagged conservatively"
}
```

### Claude vision system prompt (for `/api/scan-ingredients`)

```
You are a FODMAP dietitian assistant. You will be shown a photo of food, a meal, an ingredients label, or a restaurant menu item. Your task is to:

1. Identify every ingredient you can see or reasonably infer from the image
2. Classify each ingredient against the five FODMAP categories:
   - F (Fructans): wheat, rye, barley, onion, garlic, leek, shallot, spring onion bulb, inulin, chicory
   - O (GOS): chickpeas, lentils, kidney beans, soybeans, most legumes
   - D (Lactose): cow's milk, cream, soft cheeses (ricotta, cottage, cream cheese), ice cream, yoghurt
   - M (Excess fructose): apple, pear, mango, watermelon, cherry, honey, agave, high-fructose corn syrup
   - P (Polyols): avocado, mushroom, cauliflower, stone fruits (peach, plum, apricot, nectarine), sorbitol, xylitol, mannitol, isomalt
3. Be conservative — if an ingredient is borderline or portion-dependent, include the flag with a note
4. If the image is unclear, a packaged product, or a restaurant dish, make reasonable inferences and note your uncertainty

Return ONLY a valid JSON object:
{
  "description": "Comma-separated summary of identified ingredients",
  "ingredients": ["ingredient1", "ingredient2"],
  "fodmap_flags": ["F", "D"],
  "fodmap_ingredients": {
    "F": ["ingredient causing F flag"],
    "D": ["ingredient causing D flag"]
  },
  "confidence": "high|medium|low",
  "notes": "Any caveats, unclear items, or dose-dependency observations"
}

If no FODMAP triggers are identified, return empty arrays. If the image cannot be interpreted (blurry, unrelated), return { "error": "Unable to identify food items in this image" }.

Return only the JSON object. No preamble, no markdown fences.
```

### Important implementation notes
- Image upload is frontend-only — the base64 string is **never stored** in the database. Only the extracted ingredient text and FODMAP flags are persisted.
- The scan result is always editable before saving — treat AI output as a suggestion, not ground truth.
- Use `claude-haiku-4-5` with vision for this endpoint (same model as hypothesis engine — cheap, fast, accurate enough for ingredient recognition).
- Set a maximum image size of 5MB on the frontend before upload; reject larger files with a friendly error.
- The `scan_used` column in `meal_logs` records whether the scan flow was used, so the hypothesis engine can note scan-derived entries in its analysis if relevant.

---



```
/                   Dashboard — today's summary, quick-log buttons, hypothesis snapshot
/log/meal           Meal logging form
/log/stool          Stool logging form  
/log/context        Daily context form (stress, sleep, water, exercise, caffeine, alcohol)
/log/symptoms       Symptom logging form
/history            Scrollable log history, grouped by day
/hypotheses         Full hypothesis view with confidence ratings
/settings           API key config, data export
```

---

## AI Hypothesis Engine

### Trigger
User presses "Run AI Review" button on the `/hypotheses` page (or dashboard CTA if no hypotheses exist yet).

### What the AI receives
The backend assembles the last N days of all four log tables (default: all available data, capped at 90 days for token efficiency) and passes it as structured JSON to the Claude API.

### System prompt (backend, not user-editable)

```
You are a clinical nutrition and gastroenterology research analyst specialising in IBS trigger identification. You will be given structured diary data from a person with IBS, including meal logs with FODMAP categories, stool logs using the Bristol Stool Scale, daily context (stress, sleep, hydration, exercise, caffeine, alcohol), and symptom logs.

Your task is to analyse this data and produce a set of hypotheses about probable IBS triggers. 

ANALYSIS METHODOLOGY:
1. Apply the FODMAP framework — look for correlations between FODMAP category flags in meals and symptom events occurring 6–24 hours later. Consider portion size (larger portions = higher FODMAP load). Where `fodmap_ingredients` detail is available, use specific ingredient names in your trigger hypotheses rather than just the category letter.
2. Apply Bristol Stool Scale interpretation — types 1–2 suggest slow transit/constipation, types 6–7 suggest rapid transit/diarrhoea. Look for patterns relative to diet and context.
3. Consider confounders — high stress scores, poor sleep, and dehydration can independently produce IBS-like symptoms. Weight food correlations lower when context factors are also elevated.
4. Consider cumulative load — multiple moderate-FODMAP items in one meal may combine to exceed tolerance thresholds even if each alone is low-risk.
5. Consider dose-dependency — note if small portions of a trigger appear tolerated but large portions cause symptoms.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "summary": "A plain English paragraph summarising the key findings and overall pattern",
  "hypotheses": [
    {
      "id": "h1",
      "trigger": "Human-readable trigger name",
      "fodmap_category": "F|O|D|M|P|non-fodmap|lifestyle",
      "confidence": 0.00,
      "confidence_label": "Low|Moderate|High|Very High",
      "direction": "worsens|improves|unclear",
      "symptom_pattern": "Description of when and how symptoms manifest",
      "supporting_events": 0,
      "contradicting_events": 0,
      "notes": "Any dose-dependency, caveats, or additional observations"
    }
  ]
}

CONFIDENCE SCORING RULES:
- Base confidence on number of supporting vs contradicting events relative to total opportunities
- Penalise confidence when confounders (stress, poor sleep) are also elevated on symptom days
- Minimum 3 supporting events required before confidence can exceed 0.50
- Maximum confidence is 0.95 — never claim certainty
- If data is insufficient (fewer than 7 days of logs), note this in the summary and return hypotheses with Low confidence only

Return only the JSON object. No preamble, no markdown fences, no explanation outside the JSON.
```

### User message to AI
```
Here is the diary data for analysis:

DATA WINDOW: {start_date} to {end_date}
TOTAL MEAL LOGS: {count}
TOTAL STOOL LOGS: {count}
TOTAL CONTEXT LOGS: {count}
TOTAL SYMPTOM LOGS: {count}

MEAL LOGS:
{json}

STOOL LOGS:
{json}

CONTEXT LOGS:
{json}

SYMPTOM LOGS:
{json}

Please analyse this data and return the hypothesis JSON.
```

### Storage behaviour
- On successful AI response, **delete all existing rows** in `hypotheses` table and **insert one new row**.
- There is always at most one hypothesis record — the most recent review.
- The UI should display when the last review was run and how many entries it analysed.

---

## Mobile-First UI Requirements

- Bottom navigation bar with 5 items: Home, Meal, Stool, Context, Symptoms
- Large tap targets (minimum 44px)
- Forms use large inputs, single-column layout
- Quick-log flow: tap icon → form → submit → return to dashboard in ≤3 taps
- Dashboard shows: today's log count, last symptom score, last Bristol type, and a hypothesis teaser card
- Hypothesis page shows cards per trigger with a confidence bar/indicator

---

## Non-Functional Requirements

- All data stored in Turso (no local storage dependency)
- API key for Anthropic stored as Deno Deploy environment variable — never exposed to frontend
- The AI review call is made server-side (Deno backend) — frontend just hits `/api/review`
- Data export: `/settings` page has "Export all data as JSON" and "Export as CSV"
- No authentication required for v1 (personal use, single user)
- CORS configured to allow only the Vercel frontend origin

---

## Suggested Build Order

1. **Database setup** — Turso account, create DB, run schema migrations
2. **Deno backend scaffold** — CRUD endpoints for all four log tables
3. **React frontend scaffold** — Vite + pnpm setup, Tailwind, React Router, bottom nav
4. **Meal log form** — first logging screen with manual FODMAP entry, connect to API
5. **Ingredient scan endpoint** — `POST /api/scan-ingredients` on Deno, Claude vision integration
6. **Photo scan UI** — camera button on meal form, scan result preview + edit flow
7. **Stool log form**
8. **Context log form**
9. **Symptom log form**
10. **History page** — read all logs, group by day
11. **AI review endpoint** — `/api/review` on Deno, assembles data, calls Claude, writes hypotheses
12. **Hypotheses page** — read and render hypothesis store
13. **Dashboard** — summary cards, today's stats, quick-log shortcuts
14. **Settings + export**

---

## Environment Variables

### Deno Deploy
```
ANTHROPIC_API_KEY=sk-ant-...
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=...
CORS_ORIGIN=https://your-app.vercel.app
```

### Vercel (frontend)
```
VITE_API_BASE_URL=https://your-backend.deno.dev
```

---

## Key Clinical Notes for AI Context

Include the following as a comment block in the AI system prompt or backend documentation:

- **Transit time lag**: Symptoms from food typically manifest 6–24hrs after eating. The app's correlation logic and AI analysis must account for this window — a symptom logged at 8am should correlate against meals from the previous 6–24hr window, not the current morning.
- **FODMAP dose-dependency**: Triggers are threshold-based. A small portion of a moderate-FODMAP food may be tolerated; a large portion of the same food may not.
- **Confounder priority**: Stress and sleep are tier-1 confounders. If both a FODMAP trigger and high stress are present before a symptom event, the AI should note the ambiguity and reflect it in confidence scoring.
- **Minimum data**: Hypothesis confidence should not exceed "Moderate" until at least 14 days of data exist. The AI prompt enforces this.
- **Bristol subtype**: The user's dominant Bristol type distribution across the logging window should inform whether analysis focuses on constipation vs diarrhoea patterns.
- **Not a medical device**: The app is a personal research tool. No clinical claims. Add a disclaimer in the UI.