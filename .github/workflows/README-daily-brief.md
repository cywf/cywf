# Daily Brief Workflow - Configuration Guide

## Overview
The `daily-brief.yml` workflow automates the generation of a daily intelligence brief that includes weather, news, quotes, space weather, and trending GitHub repositories.

## Workflow Triggers
This workflow runs:
- **Scheduled**: Daily at 09:00 UTC (via cron)
- **Manual**: Can be triggered manually via workflow_dispatch

**Note**: This workflow does NOT run on push events by design - it's meant to run once daily.

## Required Configuration

### 1. GitHub Secrets
The workflow requires the following secrets to be configured in your repository settings:

#### Required:
- `OPENWEATHER_API_KEY`: API key from [OpenWeatherMap](https://openweathermap.org/api)
  - Sign up for a free account
  - Generate an API key
  - Add it to GitHub repository secrets

#### Automatically Provided:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions for repository access

#### Optional:
- `SLACK_WEBHOOK_URL`: Webhook URL for Slack notifications (if you want notifications)

### 2. API Endpoints
The workflow uses the following APIs:

#### OpenWeatherMap API
- **Current Weather**: `https://api.openweathermap.org/data/2.5/weather`
- **Forecast**: `https://api.openweathermap.org/data/2.5/forecast`
- **Status**: ✅ Active and working (as of October 2024)
- **Note**: These are the stable 2.5 endpoints, not the newer One Call API 3.0

#### ZenQuotes API
- **Endpoint**: `https://zenquotes.io/api/today`
- **Status**: ✅ Active and working (as of October 2024)
- **Note**: No API key required for basic usage

#### Other APIs Used:
- **NOAA Space Weather**: `https://services.swpc.noaa.gov/` (no key required)
- **Reuters News**: RSS feeds (no key required)
- **GitHub Trending**: Via GitHub API using GITHUB_TOKEN

## Testing Locally

To test the daily brief script locally:

```bash
# Set environment variables
export OPENWEATHER_API_KEY="your_api_key_here"
export GITHUB_TOKEN="your_github_token"

# Run the script
node scripts/daily/generate-daily-brief.js
```

## Troubleshooting

### Workflow doesn't run on push
**Expected behavior**: The workflow is configured to run daily via cron, not on every push. This is intentional.

### No jobs executed in workflow run
If you see a workflow run with "failure" status but no jobs executed, this is normal for push events since the workflow isn't configured to run on push.

### API failures
The script has graceful error handling and fallback data for all APIs. If an API fails:
- Weather: Falls back to "unavailable" message
- Quote: Falls back to predefined inspirational quotes
- Other services: Show "unavailable" messages

### Missing API key
If `OPENWEATHER_API_KEY` is not set, the weather section will show as unavailable, but the workflow will still complete successfully with other data.

##  Recent Updates (October 2024)

### API Status Verified:
- ✅ **OpenWeatherMap**: Endpoints `/data/2.5/weather` and `/data/2.5/forecast` are stable and working
- ✅ **ZenQuotes**: Endpoint `zenquotes.io/api/today` is stable and working
- ℹ️ **Note**: While OpenWeatherMap released One Call API 3.0, the 2.5 endpoints used in this workflow remain supported and functional

### Code Quality:
- ✅ Removed trailing spaces from workflow file
- ✅ YAML syntax validated
- ✅ Error handling implemented for all API calls

## Manual Trigger

To manually trigger the workflow:
1. Go to the Actions tab in your repository
2. Select "Daily Brief Automation" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Next Scheduled Run

The workflow runs daily at 09:00 UTC. Check the Actions tab to see the next scheduled run or view past runs.
