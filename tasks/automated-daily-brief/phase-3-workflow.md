# Phase 3 – Workflow Integration Tasks

## GitHub Actions workflow
- [ ] Create `.github/workflows/daily-brief.yml` with `cron: '0 9 * * *'` and manual `workflow_dispatch` trigger.
- [ ] Configure Node.js 20 runtime via `actions/setup-node@v4` with dependency caching.
- [ ] Install dependencies using `npm ci` and execute `node scripts/daily/generate-daily-brief.js`.

## Permissions & secrets
- [ ] Set `permissions: contents: write` on the workflow job.
- [ ] Reference `OPENWEATHER_API_KEY` and `GH_TOKEN` secrets (Terraform workspace) in the job environment.

## Auto-commit & artifacts
- [ ] Add `stefanzweifel/git-auto-commit-action@v4` step to commit README, archive, and asset changes with `[skip ci]` message.
- [ ] Optionally upload generated screenshots as workflow artifacts for auditing.
- [ ] Clean up or rotate old assets if necessary to prevent repo bloat.

## Error handling & observability
- [ ] Wrap data fetch/run step with retries (`p-retry` or workflow-level) to handle transient failures.
- [ ] Use `$GITHUB_STEP_SUMMARY` to publish counts of fetched items, errors, and archive path.
- [ ] Add conditional steps to skip commit if README/archive unchanged.

## Documentation updates
- [ ] Update `AUTOMATION.md` (or new doc) with workflow schedule, commands, and recovery steps.
- [ ] Note manual rerun instructions and dependency prerequisites for future maintainers.
