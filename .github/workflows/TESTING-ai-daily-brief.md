# Testing Guide for AI Daily Brief

## Prerequisites

Before testing the AI-powered daily brief workflow, ensure:

1. ✅ The `ANTHROPIC_API_KEY` secret is added to repository settings
2. ✅ The workflow file exists at `.github/workflows/ai-daily-brief.yml`
3. ✅ README.md contains the markers: `<!-- BEGIN DAILY BRIEF -->` and `<!-- END DAILY BRIEF -->`

## Manual Testing (Recommended)

### Step 1: Trigger the Workflow Manually

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. In the left sidebar, find "AI-Powered Daily Brief (Claude)"
4. Click **Run workflow** button (top right)
5. Select the branch (usually `main`)
6. Click **Run workflow**

### Step 2: Monitor the Workflow Execution

1. Wait for the workflow to start (should be immediate)
2. Click on the running workflow to view logs
3. Expand each step to see detailed output
4. Key steps to monitor:
   - **Checkout repository**: Should complete quickly
   - **Generate Daily Brief with Claude**: May take 1-3 minutes (Claude is thinking!)
   - **Update README with Claude's Output**: Should extract and archive the brief
   - **Add Job Summary**: Provides a summary of what was done

### Step 3: Verify the Output

After the workflow completes:

1. **Check README.md**:
   - Navigate to your repository root
   - View the README.md file
   - Scroll to the "📅 Daily Brief" section
   - Verify the content looks correct and is properly formatted

2. **Check Daily Archive**:
   - Navigate to the `daily/` directory
   - Find the file named `YYYY-MM-DD.md` (today's date)
   - Verify it contains:
     - YAML front matter with date and title
     - The complete daily brief content
     - All sections (Quote, Weather, News, etc.)

3. **Check Commit**:
   - Go to the repository commits page
   - Find the latest commit (should be "ci: update AI-powered Daily Brief for YYYY-MM-DD [skip ci]")
   - Verify the commit includes:
     - README.md changes
     - New daily archive file

## Expected Output Format

The daily brief should match this structure:

```markdown
<!-- BEGIN DAILY BRIEF -->
<details>
<summary><b>📰 Today's Intelligence Brief</b></summary>

<div align="center">

# 📅 Daily Brief

**Wednesday, October 29, 2025**

</div>

---

<details>
<summary><b>💭 Quote of the Day</b></summary>

### 💭 Quote of the Day

> "Quote text..."
>
> — **Author Name**

</details>

<details>
<summary><b>🌤️ Weather Report</b></summary>

## 🌤️ Weather Report

**Location:** San Juan, Puerto Rico

☀️ **Current Conditions:**
- Temperature: XX°F
- Humidity: XX%
- Wind Speed: XX mph

**Today's Forecast:**
- High: XX°F / Low: XX°F
- Precipitation: X.XX in

---

## 🌌 Space Weather Status

**KP Index:** X.X (🟢 Status)

**Recent Alerts:**
[Alert details or "No alerts"]

</details>

<details>
<summary><b>📰 Global Intelligence News</b></summary>

[News items or "**Intel data unavailable** ⛔"]

</details>

<details>
<summary><b>🔐 Cyber Pulse Report</b></summary>

[Cyber news items or "**CyberPulse data unavailable** ⛔"]

</details>

<details>
<summary><b>🔥 Trending on GitHub</b></summary>

## 🔥 Trending on GitHub

![Trending Repos Chart](assets/trending.png)

| Repo | Author | Description | Language | Stars | Forks | Link |
|------|--------|-------------|----------|-------|-------|------|
| ... | ... | ... | ... | ⭐ ... | 🔱 ... | [View](...) |

</details>

---

<div align="center">

_Generated at HH:MM AM/PM UTC_

</div>

</details>
<!-- END DAILY BRIEF -->
```

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not found"

**Cause**: The secret is not set or has the wrong name.

**Solution**:
1. Go to repository Settings → Secrets and variables → Actions
2. Verify a secret named `ANTHROPIC_API_KEY` exists
3. If not, create it with your Anthropic API key

### Issue: Workflow fails at Claude step

**Cause**: API rate limit, network issue, or invalid prompt.

**Solution**:
1. Check the workflow logs for specific error messages
2. Verify your Anthropic API key is valid and has available credits
3. Wait a few minutes and try again (may be rate limited)
4. If persistent, check Anthropic's status page

### Issue: README not updated

**Cause**: Git push failed or markers not found.

**Solution**:
1. Verify the workflow has `permissions: contents: write`
2. Check that README.md contains the exact markers:
   - `<!-- BEGIN DAILY BRIEF -->`
   - `<!-- END DAILY BRIEF -->`
3. Review the "Update README with Claude's Output" step logs

### Issue: Output is incomplete or malformed

**Cause**: Claude's output was truncated or incorrectly formatted.

**Solution**:
1. Review the Claude step logs to see what was generated
2. The prompt may need adjustment (edit `.github/workflows/ai-daily-brief.yml`)
3. Consider adding `claude_args: "--max-turns 10"` to give Claude more time
4. Simplify the prompt if it's too complex

### Issue: Daily archive not created

**Cause**: Extract/archive step failed.

**Solution**:
1. Check that the `daily/` directory exists and is writable
2. Verify the markers exist in README.md
3. Review the "Update README with Claude's Output" step logs

## Automated Testing (Scheduled Runs)

Once manual testing succeeds:

1. The workflow will run automatically daily at 10:00 UTC
2. Monitor the first few automated runs to ensure consistency
3. Check the Actions tab daily for any failures
4. Review the quality of the generated content

## Comparison with Legacy System

To compare the AI-generated brief with the legacy Python system:

1. Manually trigger the legacy workflow: `daily-brief.yml`
2. Compare the outputs side-by-side
3. Evaluate:
   - Content quality and accuracy
   - Formatting consistency
   - Data freshness
   - Error handling

## Performance Metrics

Track these metrics over the first week:

- ✅ Success rate: Should be >95%
- ⏱️ Execution time: Typically 1-3 minutes
- 📊 Content quality: Subjective but should match or exceed legacy system
- 🐛 Error rate: Should be low with graceful fallbacks

## Next Steps

After successful testing:

1. ✅ Monitor automated runs for 1 week
2. 🔧 Tune the prompt based on output quality
3. 📈 Consider adding more sections (stocks, crypto, etc.)
4. 🗑️ Optionally remove the legacy Python system if AI is reliable
5. 📝 Document any customizations or improvements

## Fallback Strategy

If the AI workflow consistently fails:

1. Re-enable the legacy workflow by uncommenting the schedule in `daily-brief.yml`
2. File an issue with error details
3. Consider hybrid approach: Use Python as primary with AI enhancement
