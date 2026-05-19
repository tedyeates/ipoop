# Corrections Log

<!-- Entries added automatically when mistakes are made. Read before starting work. -->

- ❌ Used unquoted node labels with `/` characters in Mermaid graph diagrams (e.g., `[/api/meals]`) and special characters like `<`, `&`, `{`, `"` in sequence diagram messages → ✅ Quote all node labels containing special characters with double quotes (e.g., `["POST /api/meals"]`) and avoid `<`, `>`, `&`, `{`, `}`, `"` in sequence diagram message text (Mermaid interprets `/` as shape delimiters and special chars break parsing)