# README Automation Documentation

## Overview

This repository contains automated workflows that update the README.md file daily with fresh data from GitHub.

## Workflows

### 1. Update README with Latest Gists (`update-readme.yml`)

**Schedule:** Daily at 10:00 UTC  
**Purpose:** Fetches the 20 most recent public gists and updates the "Latest Blog Posts" section.

**How it works:**
1. Checks out the repository
2. Sets up Node.js runtime
3. Runs `scripts/fetch-gists.js` to fetch gists from GitHub API
4. Updates the README.md between `<!-- GISTS_START -->` and `<!-- GISTS_END -->` markers
5. Updates the Last Sync timestamp
6. Commits and pushes changes if any updates were made

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

### 2. Update Project Status Matrix (`update-project-status.yml`)

**Schedule:** Daily at 11:00 UTC  
**Purpose:** Updates the CI/CD status badges for all tracked projects.

**How it works:**
1. Checks out the repository
2. Sets up Node.js runtime
3. Runs `scripts/fetch-project-status.js` to check workflow statuses
4. Updates the README.md between `<!-- PROJECT_MATRIX_START -->` and `<!-- PROJECT_MATRIX_END -->` markers
5. Commits and pushes changes if any updates were made

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

### 3. Update Statistics & Metrics (`update-stats.yml`)

**Schedule:** Daily at 12:00 UTC and on every push to main  
**Purpose:** Refreshes the cached GitHub statistics widgets.

**How it works:**
1. Checks out the repository
2. Updates the timestamp in the README footer
3. Warms up the cache by making requests to stat APIs
4. Commits and pushes changes if needed

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

## Scripts

### `scripts/fetch-gists.js`

Node.js script that:
- Fetches up to 20 public gists from the GitHub API
- Extracts title, description, date, and URL
- Formats data into a Markdown table
- Updates the README.md file

**Environment variables:**
- `GITHUB_TOKEN` (optional): GitHub token for API authentication

### `scripts/fetch-project-status.js`

Node.js script that:
- Checks workflow statuses for all tracked projects
- Generates badge URLs for Build, Test, Deploy, and Docs workflows
- Updates the project matrix table in README.md

**Environment variables:**
- `GITHUB_TOKEN` (optional): GitHub token for API authentication

## Tracked Projects

The following repositories are tracked in the Project Matrix:

1. FortiPath
2. sentinel-project
3. AegisNet
4. AirwayAtlas
5. willow
6. OTG-TAK
7. InfraGuard
8. NetNinja
9. ZeroTier-Toolkit
10. AlphaNest
11. Boilerplates
12. CTF-Kit
13. cywf.github.io

## Manual Updates

To manually update the README:

1. Go to the **Actions** tab in GitHub
2. Select the workflow you want to run
3. Click **Run workflow**
4. Wait for the workflow to complete

## Maintenance

### Adding New Projects

To add a new project to the matrix:

1. Edit `scripts/fetch-project-status.js`
2. Add a new entry to the `PROJECTS` array with:
   - `name`: Display name
   - `description`: Short description
   - `repo`: Repository name

### Modifying Update Schedule

To change when workflows run:

1. Edit the workflow file in `.github/workflows/`
2. Modify the `cron` schedule expression
3. Commit and push the changes

### Troubleshooting

If a workflow fails:

1. Check the Actions tab for error logs
2. Verify the GitHub token has `contents: write` permission
3. Ensure the README markers are present:
   - `<!-- GISTS_START -->` and `<!-- GISTS_END -->`
   - `<!-- PROJECT_MATRIX_START -->` and `<!-- PROJECT_MATRIX_END -->`
   - `<!-- LAST_SYNC -->` and `<!-- /LAST_SYNC -->`
   - `<!-- UPDATE_TIME -->` and `<!-- /UPDATE_TIME -->`

## Permissions

All workflows use the built-in `GITHUB_TOKEN` with the following permissions:
- `contents: write` - Required to commit and push changes to the repository

## Notes

- All commits made by automation include `[skip ci]` to prevent triggering additional workflow runs
- The scripts are designed to be resilient and will skip updates if data cannot be fetched
- Badge URLs automatically update based on the latest workflow runs in each repository
