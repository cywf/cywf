# AI-Powered Daily Brief with Claude

This document describes the Claude AI integration for generating the daily intelligence brief.

## Overview

The `ai-daily-brief.yml` workflow uses Anthropic's Claude AI to generate a comprehensive daily brief that includes:

- 💭 Quote of the Day
- 🌤️ Weather Report (San Juan, Puerto Rico)
- 🌌 Space Weather Status
- 📰 Global Intelligence News
- 🔐 Cyber Pulse Report
- 🔥 Trending on GitHub

## Setup Instructions

### 1. Add Anthropic API Key Secret

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your Anthropic API key (get it from https://console.anthropic.com/)
5. Click "Add secret"

### 2. Enable the Workflow

The workflow is configured to run:
- **Automatically**: Daily at 10:00 UTC (06:00 Puerto Rico time)
- **Manually**: Via workflow_dispatch from the Actions tab

### 3. Disable Legacy Python Workflow (Optional)

The original Python-based `daily-brief.yml` workflow has been modified to manual-trigger only to avoid conflicts. You can:
- Keep it as a backup fallback
- Delete it entirely if Claude is working consistently
- Re-enable it if Claude encounters issues

## How It Works

1. **Checkout**: Clones the repository
2. **Claude Generation**: Uses `anthropics/claude-code-action@v1` to:
   - Execute a comprehensive prompt
   - Fetch real-time data from various sources
   - Generate markdown content matching the existing format
   - Update README.md between `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->` markers
3. **Archive**: Extracts the daily brief and saves it to `daily/YYYY-MM-DD.md` with YAML front matter
4. **Commit**: Pushes changes back to the repository with a descriptive commit message

## Claude Prompt Design

The prompt instructs Claude to:
- Maintain the exact format and emoji style of the existing brief
- Use collapsible `<details>` sections for each subsection
- Fetch real-time data (quotes, weather, news, trending repos)
- Provide graceful fallbacks when data is unavailable
- Output only the content between the daily brief markers

## Data Sources

Claude is instructed to use (where accessible):
- **Quotes**: Inspirational/philosophical quotes from various sources
- **Weather**: OpenMeteo API or similar (San Juan, PR coordinates: 18.4655, -66.1057)
- **Space Weather**: NOAA Space Weather Prediction Center
- **News**: Reuters, AP News, BBC World News
- **Cybersecurity**: Security bulletins, recent breaches, vulnerability announcements
- **GitHub Trending**: GitHub trending repositories API

## Advantages Over Python System

1. **Zero Code Maintenance**: Update the brief format by editing the prompt, not Python code
2. **Better Summarization**: Claude can provide more natural language summaries
3. **Adaptive**: Claude can handle API changes and find alternative sources automatically
4. **Extensible**: Add new sections by updating the prompt
5. **Error Handling**: Built-in fallbacks for unavailable data

## Monitoring

Check the workflow runs in the Actions tab:
- ✅ Green check: Successful generation
- ❌ Red X: Failed generation (check logs)

If Claude consistently fails:
1. Check the ANTHROPIC_API_KEY secret is set correctly
2. Review the Claude API usage limits
3. Check the prompt isn't too long or complex
4. Consider falling back to the legacy Python workflow

## Fallback Strategy

To add automatic fallback to the Python script:

```yaml
- name: Generate Daily Brief with Claude
  id: claude
  continue-on-error: true
  uses: anthropics/claude-code-action@v1
  # ... existing config ...

- name: Fallback to Python Script
  if: steps.claude.outcome == 'failure'
  run: |
    echo "⚠️ Claude generation failed, falling back to Python..."
    pip install -r requirements.txt
    python scripts/generate_daily_brief.py
```

## Customization

### Adjust Claude Model

Edit the workflow to add `claude_args`:

```yaml
with:
  anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
  claude_args: "--model claude-3-opus-20240229 --max-turns 10"
  prompt: |
    ...
```

### Modify Content Sections

Edit the prompt in `ai-daily-brief.yml` to:
- Add new sections (e.g., "Stock Market Summary")
- Remove existing sections
- Change formatting or emoji usage
- Adjust summary length or detail level

## Troubleshooting

### Issue: Workflow fails with "ANTHROPIC_API_KEY not found"
**Solution**: Ensure the secret is added in repository settings with the exact name `ANTHROPIC_API_KEY`

### Issue: Claude output is incomplete or malformed
**Solution**: 
- Increase `--max-turns` in `claude_args`
- Simplify the prompt
- Break the task into smaller subtasks

### Issue: Daily brief section is empty
**Solution**: 
- Check Claude's output in the workflow logs
- Verify the README markers exist: `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->`
- Ensure Claude has proper permissions to modify files

### Issue: Commit and push fails
**Solution**: Verify the workflow has `permissions: contents: write`

## Future Enhancements

1. **Integrate Gists & Project Matrix**: Extend Claude's prompt to also update these sections
2. **Add Charts**: Generate visual charts for trending data
3. **Personalization**: Customize content based on user preferences
4. **Multi-language**: Generate briefs in multiple languages
5. **Email Digest**: Send the brief via email as well

## License

Same as repository license.
