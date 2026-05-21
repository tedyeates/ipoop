---
inclusion: manual
---
# Product Overview

IBS Trigger Tracker ("iPoop") — personal, mobile-first web app for logging food intake and bowel health, then using AI to identify probable IBS triggers with confidence ratings.

## Key Constraints
- Solo-use personal tool — no multi-user auth in v1
- Not a medical device — include disclaimer in UI
- AI outputs are suggestions, always editable before saving
- Hypotheses table overwritten on each AI review (single record)
- Image uploads never persisted — only extracted text/flags stored
