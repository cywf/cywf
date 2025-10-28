# Multi-Agent Daily Brief System

This directory contains the multi-agent architecture for the daily intelligence brief generation system.

## Architecture Overview

The system consists of:
- **5 independent agents** - each responsible for a specific data section
- **1 orchestrator** - coordinates agents and assembles the final brief
- **Parallel execution** - agents run concurrently for optimal performance
- **Graceful degradation** - system continues even if individual agents fail

## Agents

### 1. QuoteAgent (`quote_agent.py`)
Fetches inspirational Quote of the Day.

**Data Sources:**
- Primary: ZenQuotes API (`zenquotes.io/api/today`)
- Fallback: Quotable.io API (`api.quotable.io/random`)
- Final Fallback: Rotating set of 10 hardcoded quotes

**Output:** 
- `output/quote.json` - Quote data and metadata
- `output/quote.md` - Formatted markdown

### 2. WeatherAgent (`weather_agent.py`)
Handles terrestrial weather and space weather data.

**Data Sources:**
- Terrestrial: Open-Meteo API (no auth required)
  - Location: San Juan, Puerto Rico
  - Data: Temperature, humidity, wind, forecast
- Space: NOAA SWPC
  - KP Index (geomagnetic activity)
  - Space weather alerts

**Output:**
- `output/weather.json` - Weather data and metadata
- `output/weather.md` - Combined weather report

### 3. IntelAgent (`intel_agent.py`)
Produces the Global Intelligence Report from news feeds.

**Data Sources:**
- Reuters World News RSS
- AP World News RSS
- BBC News World RSS

**Features:**
- Fetches top 3 stories
- Parses and cleans RSS XML
- Generates 3-sentence digest per story
- Handles feed errors gracefully with fallbacks

**Output:**
- `output/intel.json` - News stories and metadata
- `output/intel.md` - Formatted intelligence report

### 4. CyberPulseAgent (`cyberpulse_agent.py`)
Compiles top cybersecurity headlines.

**Data Sources:**
- BleepingComputer RSS feed
- KrebsOnSecurity RSS feed
- The Hacker News RSS feed

**Features:**
- Top 3 cybersecurity headlines
- Captures favicons from source sites
- Who/what/when/where/why digest format

**Output:**
- `output/cyberpulse.json` - Cyber news and metadata
- `output/cyberpulse.md` - Formatted cyber pulse report

### 5. TrendingAgent (`trending_agent.py`)
Queries GitHub Trending repositories.

**Data Sources:**
- Primary: GitHub Search API (trending repos from last 7 days)
- Fallback: Gitterapp API

**Features:**
- Top 3 trending repositories
- Generates bar chart visualization (stars vs forks)
- Creates markdown table with repo details

**Output:**
- `output/trending.json` - Trending repos metadata
- `output/trending.md` - Formatted trending report with chart
- `/assets/trending.png` - Generated chart image

## Base Agent Class (`base_agent.py`)

All agents inherit from `BaseAgent` which provides:

### Core Methods
- `fetch()` - Abstract method to fetch data from source
- `render(data)` - Abstract method to render data as markdown
- `run()` - Execute complete workflow (fetch → render → save)

### Error Handling
- Automatic exception catching and logging
- Graceful error output generation
- Status tracking (initialized/running/success/error)

### Output Management
- Writes both JSON metadata and Markdown output
- Consistent file naming scheme
- UTF-8 encoding for international characters

## Orchestrator (`/scripts/generate_daily_brief.py`)

The orchestrator coordinates all agents and assembles the final brief.

### Workflow

1. **Spawn Agents** - Run all 5 agents in parallel using ThreadPoolExecutor
2. **Collect Outputs** - Read markdown files from `agents/output/`
3. **Generate Brief** - Assemble unified markdown document
4. **Update README** - Inject brief between `<!-- BEGIN DAILY BRIEF -->` markers
5. **Create Archive** - Save dated brief to `daily/YYYY-MM-DD.md`

### Key Features

- **Parallel Execution**: All agents run concurrently (typically ~5-10 seconds total)
- **Non-Blocking**: Waits for all agents to complete
- **Graceful Failure**: Missing data shows placeholder with error message
- **Comprehensive Logging**: Detailed execution logs for debugging

### Running the Orchestrator

```bash
# From repository root
python scripts/generate_daily_brief.py
```

## Dependencies

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Required packages:
- `requests` - HTTP client for API calls
- `matplotlib` - Chart generation for trending repos
- `pillow` - Image processing support

## Testing Individual Agents

Each agent can be tested independently:

```bash
cd agents

# Test QuoteAgent
python quote_agent.py

# Test WeatherAgent
python weather_agent.py

# Test IntelAgent
python intel_agent.py

# Test CyberPulseAgent
python cyberpulse_agent.py

# Test TrendingAgent
python trending_agent.py
```

## Output Structure

```
agents/
├── output/              # Temporary agent outputs (gitignored)
│   ├── quote.json
│   ├── quote.md
│   ├── weather.json
│   ├── weather.md
│   ├── intel.json
│   ├── intel.md
│   ├── cyberpulse.json
│   ├── cyberpulse.md
│   ├── trending.json
│   └── trending.md
├── base_agent.py        # Base class
├── quote_agent.py       # Quote agent
├── weather_agent.py     # Weather agent
├── intel_agent.py       # Intel agent
├── cyberpulse_agent.py  # Cyber agent
└── trending_agent.py    # Trending agent
```

## Security Considerations

- ✅ No API keys required (all public endpoints)
- ✅ No credentials hardcoded in source
- ✅ Safe URL parsing and input validation
- ✅ Timeout protection on all HTTP requests
- ✅ Error messages don't expose sensitive data

## Extending the System

To add a new agent:

1. Create `new_agent.py` in `/agents`
2. Inherit from `BaseAgent`
3. Implement `fetch()` and `render()` methods
4. Add agent to orchestrator's agent list
5. Update orchestrator's `generate_brief()` method

Example:

```python
from base_agent import BaseAgent

class NewAgent(BaseAgent):
    def __init__(self):
        super().__init__("NewName")
    
    def fetch(self):
        # Fetch data from source
        return data
    
    def render(self, data):
        # Return markdown string
        return markdown
```

## Troubleshooting

### Agent fails with network error
- Check internet connectivity
- Verify API endpoint is accessible
- Check for rate limiting

### Output files not generated
- Ensure `agents/output/` directory exists
- Check file permissions
- Review agent logs for errors

### README not updating
- Verify `<!-- BEGIN DAILY BRIEF -->` markers exist in README.md
- Check orchestrator has write permissions
- Review orchestrator logs

## GitHub Actions Integration

The system runs daily via GitHub Actions (`.github/workflows/daily-brief.yml`):

- **Schedule**: Daily at 10:00 UTC (6:00 AM Puerto Rico time)
- **Manual Trigger**: Available via workflow_dispatch
- **Auto-commit**: Changes committed and pushed automatically

## License

Part of the cywf/cywf repository automation system.
