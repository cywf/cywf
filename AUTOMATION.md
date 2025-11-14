# README Automation Documentation

## Overview

This repository contains automated workflows that update the README.md file daily with fresh data from GitHub.

## Workflows

### 1a. AI-Powered Daily Brief (`ai-daily-brief.yml`) ⭐ NEW

**Schedule:** Daily at 10:00 UTC / 06:00 Puerto Rico time (`cron: '0 10 * * *'`)  
**Purpose:** Generates a comprehensive daily intelligence brief using OpenAI's GPT-4o-mini (with fallback to GPT-4o) with weather, news, space weather, quotes, and GitHub trending repos.

**How it works:**
1. Checks out the repository
2. Uses OpenAI Chat Completions API to generate the daily brief
3. **Validates** the generated content before updating README:
   - Ensures content is not empty and has sufficient detail
   - Verifies presence of required markers and HTML tags
   - Checks for proper formatting (literal tags, not HTML-escaped)
4. Updates README.md using **Python-based replacement logic** (replaced brittle AWK/sed)
5. Handles missing markers by automatically creating a new Daily Brief section
6. Creates a daily archive in `/daily/YYYY-MM-DD.md` with YAML front matter
7. Commits and pushes changes automatically (with `[skip ci]` flag)
8. Generates job summary with date and archive path

**Key advantages:**
- **Robust validation**: 7-point validation checks prevent malformed content from corrupting README
- **Idempotent**: Can run multiple times without breaking README structure
- **Python-based updates**: Safer and more maintainable than shell AWK/sed pipelines
- **Auto-recovery**: Creates markers if they don't exist
- **Intelligent summarization**: AI provides natural language summaries
- **Adaptive**: Automatically handles API changes and finds alternative data sources
- **Extensible**: Add new sections by simply updating the prompt
- **Built-in fallbacks**: Graceful error handling for unavailable data

**Data sources (requested from OpenAI):**
- **Weather:** OpenMeteo API or similar (San Juan, Puerto Rico)
- **News:** Reuters, AP News, BBC World News (top 3 headlines)
- **Space Weather:** NOAA SWPC alerts and KP index
- **Quote:** Inspirational/philosophical quotes from various sources
- **Trending:** GitHub's top 3 trending repositories (past week)
- **Cybersecurity:** Recent security bulletins, breaches, vulnerability announcements

**Manual trigger:** You can manually trigger this workflow from the Actions tab.

**Environment variables:**
- `OPENAI_API_KEY` (required): Get from https://platform.openai.com/api-keys
- `GH_TOKEN` (required): GitHub personal access token with repo write permissions
- `OPENWEATHER_API_KEY` (optional): For weather data
- `NOAA_API_URL` (optional): For space weather data
- `ZENQUOTES_API_URL` (optional): For quotes

**Validation Checks:**
1. File is not empty
2. Contains `<details>` block
3. Contains date header (`# 📅 Daily Brief`)
4. Has real content (>10 non-empty lines)
5. Includes both `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->` markers
6. Uses literal HTML tags (not escaped like `&lt;details&gt;`)
7. Markers are in correct order

**Testing:** Run `python3 scripts/daily/test-workflow-logic.py` to test validation and update logic.

### 1b. Daily Brief Automation - Legacy Python (`daily-brief.yml`)

**Schedule:** Manual trigger only (automatic schedule disabled)  
**Purpose:** Legacy Python-based daily intelligence brief generator (kept as backup).

**Status:** This workflow has been superseded by the AI-powered workflow above but is kept as a fallback option.

**How it works:**
1. Checks out the repository
2. Sets up Python 3.12 runtime
3. Runs `scripts/generate_daily_brief.py` using multi-agent architecture
4. Updates the README.md between `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->` markers
5. Creates a daily archive in `/daily/YYYY-MM-DD.md` with YAML front matter
6. Commits and pushes changes automatically

**Manual trigger:** Available from the Actions tab as a fallback if AI workflow encounters issues.

### 2. Update README with Latest Gists (`update-readme.yml`)

**Schedule:** Daily at 10:00 UTC (`cron: '0 10 * * *'`)  
**Purpose:** Randomly selects 5 public gists and updates the "Latest Blog Posts" section daily.

**How it works:**
1. Checks out the repository
2. Sets up Node.js runtime
3. Runs `scripts/fetch-gists.js` to fetch up to 100 gists from GitHub API
4. Randomly selects 5 gists using Fisher-Yates shuffle algorithm
5. Updates the README.md between `<!-- GISTS_START -->` and `<!-- GISTS_END -->` markers
6. Updates the Last Sync timestamp
7. Commits and pushes changes if any updates were made

**Note:** The selection changes daily, providing variety in displayed content.

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
- Fetches up to 100 public gists from the GitHub API
- Randomly selects 5 gists using Fisher-Yates shuffle algorithm
- Extracts title, description, date, and URL
- Formats data into a Markdown table
- Updates the README.md file

**Note:** The random selection changes each time the script runs (daily via automation).

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
- If OpenWeather API fails, the brief will still generate with fallback messages ("Data unavailable ⛔")
- News/space weather/trending failures are non-blocking with graceful fallbacks
- All data fetchers have built-in error handling and retry logic
- Check that `OPENWEATHER_API_KEY` is set in repository secrets
- Review daily archive files in `/daily/` for full output
- The workflow will never fail due to network/API errors

## Permissions

All workflows use the built-in `GITHUB_TOKEN` with the following permissions:
- `contents: write` - Required to commit and push changes to the repository

## Notes

- The Daily Brief workflow uses `feat: enhance daily brief workflow with live weather, intel, space, and trending repos` as commit message
- Other automation commits include `[skip ci]` to prevent triggering additional workflow runs
- The scripts are designed to be resilient and will skip updates if data cannot be fetched
- Badge URLs automatically update based on the latest workflow runs in each repository
- All date/time values in the daily brief use UTC timezone
- Weather data uses metric units (Celsius for temperature) with wind speed converted to mph for local relevance
