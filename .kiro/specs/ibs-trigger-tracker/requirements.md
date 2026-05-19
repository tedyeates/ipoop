# Requirements Document

## Introduction

The IBS Trigger Tracker is a personal, mobile-first web application for logging food intake and bowel health data, then using AI to identify probable IBS triggers with confidence ratings. The application allows a single user to log meals (with FODMAP category tagging), stool events (Bristol Stool Scale), daily lifestyle context, and symptoms. An AI hypothesis engine correlates logged data over a 6–24 hour transit window to surface probable dietary and lifestyle triggers. The tool is for personal research only and is not a medical device.

## Glossary

- **Tracker**: The IBS Trigger Tracker web application
- **Meal_Logger**: The subsystem responsible for capturing and persisting meal log entries
- **Stool_Logger**: The subsystem responsible for capturing and persisting stool log entries
- **Context_Logger**: The subsystem responsible for capturing daily lifestyle context entries
- **Symptom_Logger**: The subsystem responsible for capturing symptom severity entries
- **Ingredient_Scanner**: The subsystem that processes meal photos via Claude vision API to extract ingredients and FODMAP classifications
- **Hypothesis_Engine**: The AI subsystem that analyses logged data and generates trigger hypotheses with confidence ratings
- **Dashboard**: The home page displaying today's summary, quick-log buttons, and hypothesis snapshot
- **FODMAP**: Fermentable Oligosaccharides, Disaccharides, Monosaccharides, and Polyols — five categories of fermentable carbohydrates (F, O, D, M, P)
- **Bristol_Stool_Scale**: A medical classification of stool forms into seven types (1–7)
- **Transit_Window**: The 6–24 hour delay between food ingestion and symptom manifestation
- **Confidence_Rating**: A numeric score (0.00–0.95) indicating the strength of evidence for a trigger hypothesis
- **ULID**: Universally Unique Lexicographically Sortable Identifier used for all primary keys

## Requirements

### Requirement 1: Meal Logging

**User Story:** As a user, I want to log my meals with FODMAP category tags and portion details, so that I can track dietary intake for trigger analysis.

#### Acceptance Criteria

1. WHEN the user submits a meal log entry, THE Meal_Logger SHALL persist the entry with a ULID, ISO8601 timestamp, meal type (breakfast, lunch, dinner, or snack), free-text description (maximum 500 characters), FODMAP flags, portion size, eating speed, and scan_used flag, where description is required and meal type, FODMAP flags, portion size, and eating speed are optional.
2. THE Meal_Logger SHALL allow multi-selection of zero or more FODMAP categories (F, O, D, M, P) for each meal entry.
3. WHERE the user provides ingredient detail, THE Meal_Logger SHALL store a JSON array of up to 50 ingredient strings (each maximum 100 characters) and a JSON object mapping FODMAP categories to their triggering ingredients.
4. WHEN the user selects a portion size, THE Meal_Logger SHALL accept one of: small, medium, or large.
5. WHEN the user selects an eating speed, THE Meal_Logger SHALL accept one of: slow, normal, or fast.
6. THE Meal_Logger SHALL record whether the ingredient photo scan was used for the entry as a boolean value (0 or 1), defaulting to 0 if the scan was not used.
7. IF the user submits a meal log entry with a missing description or a description exceeding 500 characters, THEN THE Meal_Logger SHALL reject the submission and display an error message indicating the validation failure.
8. IF the user submits a meal log entry with a meal type value not in the allowed set (breakfast, lunch, dinner, snack), THEN THE Meal_Logger SHALL reject the submission and display an error message indicating the invalid meal type.

### Requirement 2: Stool Logging

**User Story:** As a user, I want to log stool events using the Bristol Stool Scale, so that I can track bowel patterns over time.

#### Acceptance Criteria

1. WHEN the user submits a stool log entry, THE Stool_Logger SHALL persist the entry with a ULID, ISO8601 timestamp, Bristol type (integer 1–7), and optional frequency (integer 1–20), urgency (boolean 0 or 1), pain score (integer 0–10), blood flag (boolean 0 or 1), and notes (free text, maximum 1000 characters).
2. THE Stool_Logger SHALL validate that the Bristol type is an integer between 1 and 7 inclusive and that the pain score, when provided, is an integer between 0 and 10 inclusive.
3. IF a submitted stool log entry fails validation, THEN THE Stool_Logger SHALL reject the entry without persisting it and return an error response indicating which fields failed validation.
4. THE Stool_Logger SHALL validate that frequency, when provided, is an integer between 1 and 20 inclusive.

### Requirement 3: Daily Context Logging

**User Story:** As a user, I want to log daily lifestyle factors such as stress, sleep, and hydration, so that the AI can account for confounders in trigger analysis.

#### Acceptance Criteria

1. WHEN the user submits a context log entry, THE Context_Logger SHALL persist the entry with a ULID, ISO8601 timestamp, and all provided context fields.
2. THE Context_Logger SHALL accept the following optional fields: stress score (1–10), sleep hours (decimal), sleep quality (1–5), water intake in litres (decimal), exercise type, exercise duration in minutes, caffeine in milligrams, alcohol in units (decimal), medications (free text, maximum 500 characters), menstrual phase, and notes (free text, maximum 1000 characters).
3. THE Context_Logger SHALL validate that the stress score is an integer between 1 and 10 inclusive.
4. THE Context_Logger SHALL validate that the sleep quality is an integer between 1 and 5 inclusive.
5. THE Context_Logger SHALL validate that sleep hours is a decimal between 0.0 and 24.0 inclusive, water intake is a decimal between 0.0 and 20.0 inclusive, exercise duration is an integer between 0 and 1440 inclusive, caffeine is an integer between 0 and 2000 inclusive, and alcohol units is a decimal between 0.0 and 50.0 inclusive.
6. WHEN the user selects an exercise type, THE Context_Logger SHALL accept one of: none, walk, gym, run, or other.
7. WHEN the user selects a menstrual phase, THE Context_Logger SHALL accept one of: follicular, ovulatory, luteal, menstrual, or n/a.
8. IF any provided field fails validation, THEN THE Context_Logger SHALL reject the entire entry, return an error message indicating which field failed and why, and not persist any data.
9. WHEN the user submits a context log entry with at least one valid optional field provided, THE Context_Logger SHALL accept the entry regardless of which other optional fields are omitted.

### Requirement 4: Symptom Logging

**User Story:** As a user, I want to log symptom severity scores, so that the AI can correlate symptoms with dietary and lifestyle data.

#### Acceptance Criteria

1. WHEN the user submits a symptom log entry, THE Symptom_Logger SHALL persist the entry with a ULID, ISO8601 timestamp, and severity scores for bloating, cramping, nausea, urgency, fatigue, and an overall score, where all six severity fields are required.
2. THE Symptom_Logger SHALL validate that each severity score is an integer between 0 and 10 inclusive.
3. IF any severity score fails validation, THEN THE Symptom_Logger SHALL reject the submission, preserve the user's entered data, and display an error message indicating which fields are invalid.
4. THE Symptom_Logger SHALL accept optional free-text notes with each symptom entry, limited to a maximum of 1000 characters.
5. WHEN the Symptom_Logger successfully persists a symptom log entry, THE Symptom_Logger SHALL display a success confirmation and return the user to the dashboard.

### Requirement 5: Ingredient Photo Scanning

**User Story:** As a user, I want to photograph my meal and have AI identify ingredients with FODMAP classifications, so that I can quickly and accurately tag meals without manual lookup.

#### Acceptance Criteria

1. WHEN the user captures or selects a meal photo, THE Ingredient_Scanner SHALL send the image to the Claude vision API and return a structured list of identified ingredients with FODMAP category classifications within 15 seconds.
2. THE Ingredient_Scanner SHALL return a JSON response containing: a description summary, an ingredients array, FODMAP flags array (subset of F, O, D, M, P), a FODMAP-to-ingredients mapping, a confidence level (high, medium, or low), and optional notes.
3. WHEN the Ingredient_Scanner returns results, THE Meal_Logger SHALL pre-populate the description field with a comma-joined ingredient summary, pre-tick the matching FODMAP category checkboxes, and display an expandable ingredient breakdown showing which ingredient triggered which FODMAP flag, allowing the user to review and edit all fields before saving.
4. IF the selected image exceeds 5MB, THEN THE Ingredient_Scanner SHALL reject the image before upload and display an error message indicating the file size limit.
5. THE Tracker SHALL NOT persist uploaded images — only the extracted text and FODMAP flags SHALL be stored in the database.
6. IF the image cannot be interpreted as food (blurry, unrelated content, or no identifiable food items), THEN THE Ingredient_Scanner SHALL return an error message indicating that food items could not be identified.
7. THE Ingredient_Scanner SHALL classify ingredients conservatively — borderline or portion-dependent items SHALL be flagged with a note explaining the dose-dependency rather than omitted.
8. IF the selected image is not of a supported type (JPEG, PNG, GIF, or WebP), THEN THE Ingredient_Scanner SHALL reject the image and display an error message indicating the accepted formats.
9. IF the Claude vision API is unreachable or fails to respond within 15 seconds, THEN THE Ingredient_Scanner SHALL display an error message indicating the scan service is temporarily unavailable and allow the user to retry or proceed with manual entry.

### Requirement 6: AI Hypothesis Engine

**User Story:** As a user, I want to run an on-demand AI review of my logged data, so that I can discover probable IBS triggers with confidence ratings.

#### Acceptance Criteria

1. WHEN the user triggers an AI review, THE Hypothesis_Engine SHALL assemble all log data (meals, stools, context, symptoms) from the available window (up to 90 days) and submit it to the Claude API for analysis within a maximum timeout of 60 seconds.
2. THE Hypothesis_Engine SHALL correlate meal FODMAP flags with symptom events (any symptom dimension scoring 4 or above on the 0–10 scale) occurring within the 6–24 hour Transit_Window after each meal.
3. THE Hypothesis_Engine SHALL consider confounders (stress score ≥ 7, sleep quality ≤ 2, water intake < 1.0 litre) and reduce confidence in food-based hypotheses by at least 0.15 when one or more lifestyle confounders are elevated on the same symptom day.
4. THE Hypothesis_Engine SHALL consider FODMAP dose-dependency — noting when small portions of a trigger appear tolerated but large portions cause symptoms.
5. THE Hypothesis_Engine SHALL consider cumulative FODMAP load — multiple moderate-FODMAP items in one meal may combine to exceed tolerance thresholds.
6. THE Hypothesis_Engine SHALL return hypotheses as a JSON array where each hypothesis includes: trigger name, FODMAP category, confidence score (0.00–0.95), confidence label, direction (worsens, improves, or unclear), symptom pattern description, supporting event count, contradicting event count, and notes.
7. THE Hypothesis_Engine SHALL assign confidence labels as: Low (0.00–0.39), Moderate (0.40–0.64), High (0.65–0.84), Very High (0.85–0.95).
8. THE Hypothesis_Engine SHALL require a minimum of 3 supporting events before confidence can exceed 0.50.
9. WHILE fewer than 7 days of log data exist, THE Hypothesis_Engine SHALL return hypotheses with Low confidence only and note insufficient data in the summary. WHILE fewer than 14 days of log data exist, THE Hypothesis_Engine SHALL cap confidence at Moderate (maximum 0.64).
10. WHEN a review completes successfully, THE Hypothesis_Engine SHALL overwrite all existing hypothesis records with the new result — at most one hypothesis record SHALL exist at any time.
11. THE Hypothesis_Engine SHALL execute all AI calls server-side on the Deno backend — the Anthropic API key SHALL NOT be exposed to the frontend.
12. IF the Claude API call fails or exceeds the 60-second timeout, THEN THE Hypothesis_Engine SHALL return an error response indicating the failure reason, preserve any existing hypothesis record unchanged, and allow the user to retry.

### Requirement 7: Dashboard

**User Story:** As a user, I want a dashboard showing today's summary and quick-access logging buttons, so that I can see my status at a glance and log data quickly.

#### Acceptance Criteria

1. THE Dashboard SHALL display today's total log count (sum of all meal, stool, context, and symptom entries logged today), the most recent symptom overall score (0–10), the most recent Bristol stool type (1–7), and a hypothesis teaser card showing the trigger name, FODMAP category, and confidence score of the hypothesis with the highest confidence.
2. IF no log entries exist for a given summary field (no symptom logs, no stool logs, or no hypotheses), THEN THE Dashboard SHALL display a placeholder indicating no data is available for that field instead of leaving it blank.
3. THE Dashboard SHALL provide quick-log buttons that navigate to each logging form (meal, stool, context, symptoms).
4. WHILE no hypotheses exist, THE Dashboard SHALL display a call-to-action that navigates the user to trigger an AI review.
5. THE Dashboard SHALL allow the user to reach any logging form and submit an entry in 3 taps or fewer from the home screen.

### Requirement 8: History Page

**User Story:** As a user, I want to browse my past logs grouped by day, so that I can review patterns and verify my data.

#### Acceptance Criteria

1. THE Tracker SHALL display a scrollable history view showing all log entries (meals, stools, context, symptoms) grouped by day in reverse chronological order, where each day section displays the date as a heading and lists entries sorted by logged_at time descending within the group.
2. THE Tracker SHALL display each log entry with a visible type indicator (meal, stool, context, or symptom) and a summary: meal entries show description and FODMAP flags; stool entries show Bristol type and pain score; context entries show stress score and sleep hours; symptom entries show overall score.
3. WHEN the user scrolls to the bottom of the currently loaded history entries, THE Tracker SHALL load the next batch of 7 days of entries and append them to the view without requiring a full page reload.
4. IF no log entries exist, THEN THE Tracker SHALL display an empty-state message indicating that no entries have been logged yet.
5. WHEN the history page is opened, THE Tracker SHALL display the most recent 14 days of log entries as the initial load.

### Requirement 9: Hypotheses Page

**User Story:** As a user, I want to view my AI-generated trigger hypotheses with confidence ratings, so that I can understand my probable IBS triggers.

#### Acceptance Criteria

1. THE Tracker SHALL display each hypothesis as a card showing the trigger name, FODMAP category, confidence score (0.00–0.95) with both a visual indicator (bar or badge) and the corresponding confidence label (Low: 0.0–0.39, Moderate: 0.40–0.64, High: 0.65–0.84, Very High: 0.85–0.95), direction (worsens, improves, or unclear), symptom pattern description, and supporting/contradicting event counts.
2. THE Tracker SHALL display the date of the last AI review (formatted as a human-readable date) and the number of log entries that were analysed.
3. WHEN the user taps the "Run AI Review" button, THE Tracker SHALL disable the button, display a loading indicator, and submit a request to the backend to trigger a new analysis.
4. THE Tracker SHALL display the AI-generated plain-English summary paragraph above the hypothesis cards.
5. IF no hypothesis record exists, THEN THE Tracker SHALL display an empty state message explaining that no analysis has been run yet and prompting the user to tap "Run AI Review".
6. IF the AI review request fails, THEN THE Tracker SHALL re-enable the "Run AI Review" button and display an error message indicating that the analysis could not be completed.

### Requirement 10: Settings and Data Export

**User Story:** As a user, I want to export all my data in JSON or CSV format, so that I can back up my data or analyse it externally.

#### Acceptance Criteria

1. WHEN the user requests a data export, THE Tracker SHALL generate an export containing all records from the meal_logs, stool_logs, context_logs, symptom_logs, and hypotheses tables in the selected format (JSON or CSV).
2. WHEN the user selects JSON format, THE Tracker SHALL produce a single downloadable file containing a top-level object with one key per table, each mapping to an array of that table's records.
3. WHEN the user selects CSV format, THE Tracker SHALL produce a separate downloadable CSV file per table (one file for each of the 5 tables), each including a header row with column names.
4. IF any of the exported tables contain no records, THEN THE Tracker SHALL include that table in the export with an empty array (JSON) or a header-only file (CSV).
5. THE Tracker SHALL name each exported file using the pattern "ipoop-export-{format}-{YYYY-MM-DD}" where the date is the current date at time of export.

### Requirement 11: Mobile-First User Interface

**User Story:** As a user, I want a mobile-optimised interface with large tap targets and efficient navigation, so that I can log data quickly on my phone.

#### Acceptance Criteria

1. THE Tracker SHALL render a fixed bottom navigation bar with 5 items: Home, Meal, Stool, Context, and Symptoms, that remains visible while the user scrolls page content.
2. THE Tracker SHALL use a minimum tap target size of 44×44 CSS pixels (width and height) for all interactive elements.
3. THE Tracker SHALL use single-column form layouts for viewports up to 768 CSS pixels wide, with form inputs rendered at full container width.
4. WHEN the user submits a log form, THE Tracker SHALL automatically navigate back to the dashboard, so that the complete quick-log flow (tap navigation icon, fill form, tap submit) completes in 3 taps or fewer.
5. WHILE the viewport width is 768 CSS pixels or less, THE Tracker SHALL display all navigation items as icon-with-label stacked vertically within each navigation tab, with equal horizontal spacing.

### Requirement 12: Data Storage and Security

**User Story:** As a user, I want my data stored securely in a cloud database with proper API key management, so that my health data is safe and the system is not exploitable.

#### Acceptance Criteria

1. THE Tracker SHALL store all persistent data (meal logs, stool logs, context logs, symptom logs, and hypotheses) in the Turso (libSQL) database using an authenticated connection via the TURSO_AUTH_TOKEN environment variable, with no dependency on browser local storage for primary data.
2. THE Tracker SHALL store the Anthropic API key as a Deno Deploy environment variable (ANTHROPIC_API_KEY) and SHALL NOT include the key value in frontend JavaScript bundles, API responses to the client, or any client-accessible source.
3. THE Tracker SHALL configure CORS to allow requests only from the origin specified in the CORS_ORIGIN environment variable. IF a request originates from a disallowed origin, THEN THE Tracker SHALL reject the request and SHALL NOT return the response body.
4. THE Tracker SHALL use ULIDs for all primary keys and ISO8601 format for all datetime fields.
5. THE Tracker SHALL NOT persist uploaded image data (base64 strings) to the database; only the extracted text, ingredient lists, and FODMAP flags derived from image scans SHALL be stored.
6. IF the Turso database is unreachable when a data operation is attempted, THEN THE Tracker SHALL return an error response indicating a storage failure without exposing internal connection details to the client.

### Requirement 13: Medical Disclaimer

**User Story:** As a user, I want to see a clear disclaimer that this tool is not a medical device, so that I understand the limitations of the AI-generated hypotheses.

#### Acceptance Criteria

1. THE Tracker SHALL display a disclaimer stating that the application is a personal research tool and not a medical device, and that AI outputs are suggestions and not clinical diagnoses.
2. THE Tracker SHALL present the disclaimer in the application footer, visible on every page.
3. THE Tracker SHALL display a contextual disclaimer adjacent to AI-generated content on the Hypotheses page and on the ingredient scan results, stating that results are AI-generated suggestions and should not replace professional medical advice.
