# AI-Powered Daily Brief with OpenAI

This document describes the OpenAI GPT-4o integration for generating the daily intelligence brief.

## Overview

The `ai-daily-brief.yml` workflow uses OpenAI's GPT-4o-mini (with fallback to GPT-4o) to generate a comprehensive daily brief that includes:

- 💭 Quote of the Day
- 🌤️ Weather Report (San Juan, Puerto Rico)
- 🌌 Space Weather Status
- 📰 Global Intelligence News
- 🔐 Cyber Pulse Report
- 🔥 Trending on GitHub

## Setup Instructions

### 1. Add OpenAI API Key Secret

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (get it from https://platform.openai.com/api-keys)
5. Click "Add secret"

### 2. Enable the Workflow

The workflow is configured to run:
- **Automatically**: Daily at 10:00 UTC (06:00 Puerto Rico time)
- **Manually**: Via workflow_dispatch from the Actions tab

### 3. Disable Legacy Workflows (Optional)

The original Python-based `daily-brief.yml` workflow and previous Claude-based workflow can be:
- Kept as backup fallbacks
- Deleted entirely if OpenAI is working consistently
- Re-enabled if OpenAI encounters issues

## How It Works

1. **Checkout**: Clones the repository
2. **OpenAI Generation**: Uses curl to call OpenAI's Chat Completions API:
   - Tries `gpt-4o-mini` model first (more cost-effective)
   - Falls back to `gpt-4o` if mini is unavailable
   - Executes a comprehensive prompt
   - Fetches real-time data from various sources
   - Generates markdown content matching the existing format
   - Saves output to temporary file `/tmp/brief.md`
3. **Update README**: Replaces content between `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->` markers
4. **Archive**: Saves the daily brief to `daily/YYYY-MM-DD.md` with YAML front matter
5. **Commit**: Pushes changes back to the repository with a descriptive commit message

## OpenAI Prompt Design

The prompt instructs GPT-4o to:
- Maintain the exact format and emoji style of the existing brief
- Use collapsible `<details>` sections for each subsection
- Fetch real-time data (quotes, weather, news, trending repos)
- Provide graceful fallbacks when data is unavailable
- Output only the content between the daily brief markers

## Data Sources

OpenAI GPT-4o is instructed to use (where accessible):
- **Quotes**: Inspirational/philosophical quotes from various sources
- **Weather**: OpenMeteo API or similar (San Juan, PR coordinates: 18.4655, -66.1057)
- **Space Weather**: NOAA Space Weather Prediction Center
- **News**: Reuters, AP News, BBC World News
- **Cybersecurity**: Security bulletins, recent breaches, vulnerability announcements
- **GitHub Trending**: GitHub trending repositories API

## Advantages Over Previous Systems

1. **Cost Effective**: GPT-4o-mini is significantly cheaper than GPT-4o and Claude
2. **Zero Code Maintenance**: Update the brief format by editing the prompt, not Python code
3. **Better Summarization**: GPT-4o can provide natural language summaries
4. **Adaptive**: Can handle API changes and find alternative sources
5. **Extensible**: Add new sections by updating the prompt
6. **Error Handling**: Built-in fallbacks (gpt-4o-mini → gpt-4o) and graceful degradation
7. **Model Flexibility**: Easy to switch between OpenAI models

## Monitoring

Check the workflow runs in the Actions tab:
- ✅ Green check: Successful generation
- ❌ Red X: Failed generation (check logs)

If OpenAI consistently fails:
1. Check the OPENAI_API_KEY secret is set correctly
2. Review the OpenAI API usage limits and billing
3. Check the prompt isn't too long or exceeds token limits
4. Consider falling back to the legacy Python workflow

## Fallback Strategy

To add automatic fallback to the Python script:

```yaml
- name: Generate Daily Brief with OpenAI
  id: openai
  continue-on-error: true
  run: |
    # ... existing OpenAI logic ...

- name: Fallback to Python Script
  if: steps.openai.outcome == 'failure'
  run: |
    echo "⚠️ OpenAI generation failed, falling back to Python..."
    pip install -r requirements.txt
    python scripts/generate_daily_brief.py
```

## Customization

### Adjust OpenAI Model

Edit the workflow to change the model:

```yaml
# In the "Generate Daily Brief with OpenAI" step
cat > /tmp/payload.json << EOF
{
  "model": "gpt-4o",  # or "gpt-4o-mini", "gpt-4-turbo-preview", etc.
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 4000
}
EOF
```

### Modify Content Sections

Edit the prompt in `ai-daily-brief.yml` to:
- Add new sections (e.g., "Stock Market Summary")
- Remove existing sections
- Change formatting or emoji usage
- Adjust summary length or detail level

## Troubleshooting

### Issue: Workflow fails with "OPENAI_API_KEY not found"
**Solution**: Ensure the secret is added in repository settings with the exact name `OPENAI_API_KEY`

### Issue: API call returns 404 or model not found
**Solution**: 
- The workflow automatically tries fallback from gpt-4o-mini to gpt-4o
- Verify your OpenAI account has access to the specified models
- Check if the model name is spelled correctly

### Issue: OpenAI output is incomplete or malformed
**Solution**: 
- Increase `max_tokens` in the JSON payload (currently 4000)
- Simplify the prompt if it's too complex
- Check OpenAI API status for any outages

### Issue: Daily brief section is empty
**Solution**: 
- Check OpenAI's output in the workflow logs
- Verify the README markers exist: `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->`
- Ensure the workflow has proper permissions to modify files

### Issue: Commit and push fails
**Solution**: Verify the workflow has `permissions: contents: write`

### Issue: API rate limits or quota exceeded
**Solution**: 
- Check your OpenAI account billing and usage
- Consider using gpt-4o-mini exclusively (more cost-effective)
- Adjust the schedule to run less frequently if needed

## Future Enhancements

1. **Integrate Gists & Project Matrix**: Extend the prompt to also update these sections
2. **Add Charts**: Generate visual charts for trending data using chart APIs
3. **Personalization**: Customize content based on user preferences
4. **Multi-language**: Generate briefs in multiple languages
5. **Email Digest**: Send the brief via email as well
6. **Function Calling**: Use OpenAI function calling for structured data fetching
7. **Vision Integration**: Add GPT-4 Vision for image analysis or chart generation

## License

Same as repository license.
