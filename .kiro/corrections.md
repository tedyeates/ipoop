# Corrections Log

<!-- Entries added automatically when mistakes are made. Read before starting work. -->

- ❌ Used unquoted node labels with `/` characters in Mermaid graph diagrams (e.g., `[/api/meals]`) and special characters like `<`, `&`, `{`, `"` in sequence diagram messages → ✅ Quote all node labels containing special characters with double quotes (e.g., `["POST /api/meals"]`) and avoid `<`, `>`, `&`, `{`, `}`, `"` in sequence diagram message text (Mermaid interprets `/` as shape delimiters and special chars break parsing)
- ❌ Assumed `deno` is in PATH on this Windows system → ✅ Deno is now installed at `C:\Users\Ted_Y\.deno\bin\deno.exe`. Prepend to PATH with `$env:Path = "C:\Users\Ted_Y\.deno\bin;$env:Path"` before running deno commands. Tests run with: `deno test --no-check --allow-net --allow-env --allow-read --config backend/deno.json backend/tests/`
- ❌ Ran `deno test` from project root without `--config backend/deno.json` → ✅ Must specify `--config backend/deno.json` when running from the repo root so the import map is picked up.
- ❌ Used `powershell -Command "$env:Path = '...'; deno test ..."` (PATH gets expanded/interpreted incorrectly with spaces in paths) → ✅ Use absolute path directly: `C:\Users\Ted_Y\.deno\bin\deno.exe test --config D:\Projects\ipoop\backend\deno.json D:\Projects\ipoop\backend\tests\`