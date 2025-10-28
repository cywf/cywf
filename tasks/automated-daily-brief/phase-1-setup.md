# Phase 1 – Setup Tasks

## Repository scaffolding
- [ ] Create feature branch following spec-bootstrap naming (e.g., `feature/daily-brief`).
- [ ] Add directories:
  - [ ] `scripts/daily/` and `scripts/daily/lib/` for orchestrator and data clients.
  - [ ] `scripts/daily/templates/` for Markdown snippets.
  - [ ] `assets/daily/` for generated images.
  - [ ] `daily/` archive folder with `.gitkeep` placeholder.
  - [ ] `config/` (or extend existing) for workflow constants.

## README placeholders & templates
- [ ] Insert `<!-- DAILY_BRIEF_START -->` and `<!-- DAILY_BRIEF_END -->` markers in README with placeholder `<details>` block.
- [ ] Add centered header template with ISO date placeholder inside the new README section.
- [ ] Draft archive front-matter template in `scripts/daily/templates/archive.md`.

## Configuration & documentation
- [ ] Create `config/daily-brief.json` containing API endpoints, asset file naming patterns, and optional feature toggles.
- [ ] Add `.env.example` entries for `OPENWEATHER_API_KEY` and other optional tokens; cross-reference Terraform workspace usage.
- [ ] Extend `AUTOMATION.md` or add `docs/daily-brief.md` describing workflow purpose, triggers, and markers.

## Dependency management
- [ ] Update `package.json` with required libraries (`undici`, `rss-parser`, `puppeteer`, `date-fns`, `p-retry`, `mustache`, `octokit`, optional `sharp`).
- [ ] Run `npm install` / `npm update` to generate lockfile entries.
- [ ] Document local development commands (e.g., `npm run daily-brief:dev`) in README or docs.

## Secret alignment
- [ ] Confirm Terraform Cloud workspace exposes `OPENWEATHER_API_KEY` and `GH_TOKEN` to workflow runtime.
- [ ] Note any additional secrets needed for optional feeds without committing real values.
