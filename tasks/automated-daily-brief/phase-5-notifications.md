# Phase 5 – Optional Notifications & Integrations

## Slack notifications
- [ ] Configure Slack webhook secret in Terraform workspace / GitHub secrets (e.g., `SLACK_WEBHOOK_URL`).
- [ ] Add conditional workflow step using `slackapi/slack-github-action` to post completion summary with success/failure status.
- [ ] Allow toggle via `config/daily-brief.json` flag or workflow input.

## Codex / issue triggers
- [ ] Add optional `actions/github-script` step to open an issue or trigger Codex tasks when the daily brief has warnings.
- [ ] Ensure triggers only fire once per run and include relevant logs/links.

## Configuration & documentation
- [ ] Document optional integrations and how to enable/disable them.
- [ ] Provide runbook entries for notification failures and secret rotation.
