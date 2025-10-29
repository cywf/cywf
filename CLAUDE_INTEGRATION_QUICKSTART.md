# Claude AI Integration - Setup & Quick Start

## 🎯 What's Been Done

This integration adds Anthropic's Claude AI to generate your daily intelligence brief automatically. The AI will fetch real-time data and create comprehensive summaries in your README.

## 📦 Files Added/Modified

### New Files
- ✅ `.github/workflows/ai-daily-brief.yml` - Main AI workflow
- ✅ `.github/workflows/README-ai-daily-brief.md` - Detailed setup and configuration guide
- ✅ `.github/workflows/TESTING-ai-daily-brief.md` - Step-by-step testing instructions
- ✅ `scripts/validate_ai_workflow.py` - Pre-deployment validation script

### Modified Files
- ✅ `.github/workflows/daily-brief.yml` - Disabled auto-schedule (kept as manual fallback)
- ✅ `AUTOMATION.md` - Updated with AI workflow documentation

## 🚀 Quick Start (5 Minutes)

### Step 1: Add Your Anthropic API Key

1. Get your API key from https://console.anthropic.com/
2. Go to your repository on GitHub
3. Navigate to: **Settings** → **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Set:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste your API key)
6. Click **"Add secret"**

### Step 2: Test the Workflow

1. Go to the **Actions** tab in your repository
2. Find **"AI-Powered Daily Brief (Claude)"** in the left sidebar
3. Click **"Run workflow"** button (top right)
4. Select your branch (usually `main`)
5. Click **"Run workflow"**
6. Wait 1-3 minutes for completion

### Step 3: Verify the Output

1. Check the workflow run completed successfully (green checkmark)
2. View your README.md - the Daily Brief section should be updated
3. Check the `daily/` folder for today's archive file
4. Review the commit history for the AI-generated update

## ✅ What the AI Will Generate

The daily brief includes:

- 💭 **Quote of the Day** - Inspirational quote
- 🌤️ **Weather Report** - San Juan, PR conditions
- 🌌 **Space Weather Status** - KP index and solar alerts
- 📰 **Global Intelligence News** - Top 3 world headlines
- 🔐 **Cyber Pulse Report** - Top 3 cybersecurity news
- 🔥 **Trending on GitHub** - Top 3 trending repos

All formatted with emojis, collapsible sections, and proper markdown styling.

## 📅 Schedule

- **Automatic**: Daily at 10:00 UTC (06:00 Puerto Rico time)
- **Manual**: Anytime via Actions tab

## 🔧 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not found"
**Solution**: Ensure the secret is added with the exact name `ANTHROPIC_API_KEY`

### Issue: Workflow succeeds but no changes
**Solution**: Claude may have determined no updates needed, or markers are missing in README.md

### Issue: Output is incomplete
**Solution**: Check the workflow logs. May need to increase `max-turns` in the workflow file

## 📚 Detailed Documentation

- **Setup Guide**: `.github/workflows/README-ai-daily-brief.md`
- **Testing Guide**: `.github/workflows/TESTING-ai-daily-brief.md`
- **Main Documentation**: `AUTOMATION.md`

## 🎨 Customization

To modify what Claude generates:

1. Edit `.github/workflows/ai-daily-brief.yml`
2. Find the `prompt:` section (line ~27)
3. Modify the instructions
4. Commit and push
5. Test manually before waiting for the scheduled run

## 🔄 Fallback to Python System

If the AI workflow has issues:

1. Edit `.github/workflows/daily-brief.yml`
2. Uncomment the schedule section (lines 4-6)
3. Commit and push
4. The Python system will resume automatic updates

## 🎉 Success Indicators

After setup, you should see:

- ✅ Daily brief section updates automatically
- ✅ New archive files in `daily/` folder each day
- ✅ Commit messages: "ci: update AI-powered Daily Brief for YYYY-MM-DD"
- ✅ Natural language summaries instead of raw API data

## 🛠️ Validation

Before first run, validate your setup:

```bash
python3 scripts/validate_ai_workflow.py
```

This checks:
- ✅ Workflow YAML syntax
- ✅ Required fields present
- ✅ README markers exist
- ✅ Claude action configured

## 🚨 Important Notes

1. **API Key Security**: Never commit your API key to the repository
2. **Token Limits**: Claude has usage limits; monitor your Anthropic dashboard
3. **Manual Fallback**: Keep the Python workflow available as backup
4. **First Run**: May take longer as Claude explores available data sources
5. **Cost**: Claude API usage has costs; review Anthropic's pricing

## 📊 Monitoring

For the first week:
- Check Actions tab daily for workflow status
- Compare AI output quality with previous Python output
- Adjust the prompt if summaries need improvement
- Monitor Anthropic API usage in their dashboard

## 🎯 Next Steps

1. ✅ Add ANTHROPIC_API_KEY secret
2. ✅ Run manual test from Actions tab
3. ✅ Verify output quality
4. ✅ Monitor first few automated runs
5. 🔧 Fine-tune prompt if needed
6. 📈 Consider extending to other sections (gists, project matrix)

## 💡 Benefits of AI Approach

Compared to the Python system:

- **No Code Maintenance**: Update via prompt, not code
- **Better Summaries**: Natural language, not raw API text
- **Adaptive**: Handles API changes automatically
- **Extensible**: Add sections by editing prompt
- **Smart Fallbacks**: Graceful handling of unavailable data

## 📝 Support

If you encounter issues:

1. Check the workflow logs in Actions tab
2. Review the documentation files mentioned above
3. Validate with `scripts/validate_ai_workflow.py`
4. Check Anthropic's status page for API issues
5. Fall back to Python workflow if needed

---

**Ready to go!** Just add the API key and run your first test. 🚀
