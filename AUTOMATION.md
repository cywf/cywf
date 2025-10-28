# README Automation Documentation

## Overview

This repository contains automated workflows that update the README.md file daily with fresh data from GitHub.

## Workflows

### 1. Daily Brief Automation (`daily-brief.yml`)

**Schedule:** Daily at 09:00 UTC (`cron: '0 9 * * *'`)  
**Purpose:** Generates a comprehensive daily intelligence brief with weather, news, space weather, quotes, and GitHub trending repos.

**How it works:**
1. Checks out the repository
2. Sets up Node.js runtime
3. Runs `scripts/daily/generate-daily-brief.js` to fetch data from multiple sources
4. Updates the README.md between `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->` markers
5. Creates a daily archive in `/daily/YYYY-MM-DD.md` with YAML front matter
6. Commits and pushes changes automatically
7. (Optional) Sends Slack notification if webhook is configured
8. Generates job summary with date and archive path

**Data sources:**
- **Weather:** OpenWeatherMap API (San Juan, Puerto Rico)
- **News:** Reuters RSS feeds for global intelligence (GRINTSUM)
- **Space Weather:** NOAA SWPC alerts and KP index
- **Quote:** ZenQuotes daily inspirational quote
- **Trending:** GitHub's trending repositories (past week)

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

**Environment variables:**
- `OPENWEATHER_API_KEY` (required): Get from https://openweathermap.org/api
- `GITHUB_TOKEN` (automatic): Provided by GitHub Actions
- `SLACK_WEBHOOK_URL` (optional): For Slack notifications

### 2. Update README with Latest Gists (`update-readme.yml`)

**Schedule:** Daily at 10:00 UTC (`cron: '0 10 * * *'`)  
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

**Schedule:** Daily at 11:00 UTC (`cron: '0 11 * * *'`)  
**Purpose:** Updates the CI/CD status badges for all tracked projects.

**How it works:**
1. Checks out the repository
2. Sets up Node.js runtime
3. Runs `scripts/fetch-project-status.js` to check workflow statuses
4. Updates the README.md between `<!-- PROJECT_MATRIX_START -->` and `<!-- PROJECT_MATRIX_END -->` markers
5. Commits and pushes changes if any updates were made

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

### 3. Update Statistics & Metrics (`update-stats.yml`)

**Schedule:** Daily at 12:00 UTC (`cron: '0 12 * * *'`) and on every push to main  
**Purpose:** Refreshes the cached GitHub statistics widgets.

**How it works:**
1. Checks out the repository
2. Updates the timestamp in the README footer
3. Commits and pushes changes if needed
4. Warms up the cache by making requests to stat APIs

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

---

## Scripts

### `scripts/daily/generate-daily-brief.js`

Main orchestrator script that:
- Ensures required directories exist (`daily/`, `assets/daily/`)
- Fetches data from all sources in parallel with error handling
- Generates formatted markdown with collapsible sections
- Updates README.md between daily brief markers
- Creates timestamped archive files with YAML front matter

**Supporting modules in `scripts/daily/lib/`:**
- `weather.js` - OpenWeatherMap API client with retry logic
- `news.js` - RSS feed parser for Reuters and other sources
- `space-weather.js` - NOAA SWPC data fetcher for alerts and KP index
- `quote.js` - ZenQuotes API client with fallback quotes
- `github-trending.js` - GitHub trending repos fetcher

### `scripts/daily/test-daily-brief.js`

Validation script that:
- Checks for required README markers
- Validates daily archive structure
- Verifies front matter format
- Tests markdown syntax
- Ensures all required sections are present
- Runs 8 comprehensive tests

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
- `GITHUB_TOKEN` (required): GitHub token for API authentication and repository write access

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
   - `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->`
   - `<!-- GISTS_START -->` and `<!-- GISTS_END -->`
   - `<!-- PROJECT_MATRIX_START -->` and `<!-- PROJECT_MATRIX_END -->`
   - `<!-- LAST_SYNC -->` and `<!-- /LAST_SYNC -->`
   - `<!-- UPDATE_TIME -->` and `<!-- /UPDATE_TIME -->`

**Daily Brief specific issues:**
- If OpenWeather API fails, the brief will still generate with fallback data
- News/space weather failures are non-blocking
- Check that `OPENWEATHER_API_KEY` is set in repository secrets
- Review daily archive files in `/daily/` for full output

## Permissions

All workflows use the built-in `GITHUB_TOKEN` with the following permissions:
- `contents: write` - Required to commit and push changes to the repository

## Notes

- All commits made by automation include `[skip ci]` to prevent triggering additional workflow runs
- The scripts are designed to be resilient and will skip updates if data cannot be fetched
- Badge URLs automatically update based on the latest workflow runs in each repository
