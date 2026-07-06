# CYWF Profile Repository Guide

## Setup

- Use Node.js 20 or newer.
- Install dependencies with `npm ci`.
- Python scripts are legacy/auxiliary; install `requirements.txt` only when working on `agents/` or Python workflow validation.

## Daily README generation flow

- `npm run profile:update` refreshes the generated README sections and validates marker integrity.
- Flow: Daily Di-Gist history (`data/daily-digists.json` + `daily/*.md`) → Latest Blog Posts; tracked repo seeds (`config/projects.json`) plus live GitHub API or `config/public-repo-portfolio.snapshot.json` fallback → System Overview, Mermaid graph, Project M3trix, and Learning sections; GitHub trending HTML → GitHub Showcase.
- `npm run digist:create` creates the Daily Di-Gist file/history entry from the last 24 hours of public repository activity.
- `npm run profile:validate` checks required README markers and basic `<details>` balance.

## Build, test, and preview

- `npm test` runs repository tests plus README validation.
- `npm run type-check` runs TypeScript validation.
- `npm run build` creates the static Next.js export in `out/`.
- `npm run dev` starts the local dashboard preview.

## README marker conventions

- Preserve these generated-content boundaries exactly: `SYSTEM_OVERVIEW`, `REPO_MERMAID`, `LATEST_POSTS`, `PROJECT_MATRIX`, `LEARNING_DYNAMIC`, and `GH_SHOWCASE`.
- Do not move generated sections outside their surrounding headings/details unless the update scripts are changed at the same time.
- Missing, reordered, or duplicated markers should fail validation rather than silently rewriting unrelated README content.

## Operational caveats

- `GITHUB_TOKEN` improves API rate limits for public repo metadata but local unauthenticated runs must still work by falling back to the checked-in snapshot/seed data.
- `PROJECTS_TOKEN` is CI-only for GitHub Projects v2 Next-Tasks. Without it, README output must clearly say Next-Tasks data is unavailable/degraded rather than imply there are no tasks.
- Do not commit secrets. Terraform Cloud workspace variables and GitHub Actions secrets are the expected homes for sensitive values.
- Scheduled workflows may update timestamps and generated README/data files; keep workflow paths and generated file paths stable.
