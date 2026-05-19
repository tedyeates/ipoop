# Product Overview

IBS Trigger Tracker ("iPoop") — a personal, mobile-first web application for logging food intake and bowel health data, then using AI to identify probable IBS triggers with confidence ratings.

## Purpose
- Log meals (with FODMAP category tagging), stool events (Bristol Stool Scale), daily context (stress, sleep, hydration, exercise), and symptoms
- Optionally scan meal photos with AI vision to auto-detect ingredients and FODMAP flags
- Run on-demand AI reviews that correlate diet/context with symptoms over a 6–24hr transit window
- Present hypotheses about triggers with confidence scores

## Key Constraints
- Solo-use personal health tool — no multi-user auth in v1 (single hardcoded user)
- Not a medical device — no clinical claims; include disclaimer in UI
- AI outputs are suggestions, never ground truth — always editable before saving
- Hypotheses table is overwritten on each AI review (at most one record exists)
- Image uploads are never persisted — only extracted text/flags are stored
