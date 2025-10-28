# Phase 4 – Testing & Validation Tasks

## Local validation
- [ ] Provide `.env.example` values and run `npm run daily-brief:dev` to generate sample output.
- [ ] Verify README diff renders expected `<details>` structure and centered date header.
- [ ] Confirm archive file `daily/YYYY-MM-DD.md` contains YAML front matter and full report content.

## Workflow dry-runs
- [ ] Use `act` or GitHub `workflow_dispatch` on a feature branch to validate job execution.
- [ ] Check auto-commit step creates expected commit message and includes assets.
- [ ] Inspect uploaded artifacts/screenshots for quality and privacy.

## Resilience & fallback checks
- [ ] Simulate API failures (e.g., disable `OPENWEATHER_API_KEY`) to confirm fallback messaging and non-blocking behavior.
- [ ] Verify partial data still produces valid Markdown and success exit code.
- [ ] Ensure secrets are not logged by scanning workflow output.

## Documentation & sign-off
- [ ] Update README/AUTOMATION docs with known limitations and troubleshooting steps discovered during tests.
- [ ] Capture evidence (screenshots, logs) for future reference and compliance.
