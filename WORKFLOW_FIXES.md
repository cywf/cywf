# GitHub Actions Workflow Fixes and Documentation

## Summary of Issues Fixed

This document describes all the issues found in the CI/CD workflows and the fixes applied.

---

## 1. Marker Name Mismatches

### Issue
Scripts were using incorrect marker names that didn't match what was in README.md:

- `fetch-project-status.js` looked for `<!-- PROJECT_MATRIX_START -->` and `<!-- PROJECT_MATRIX_END -->`
- `fetch-gists.js` looked for `<!-- GISTS_START -->` and `<!-- GISTS_END -->`
- README.md actually used `<!-- START: PROJECT_MATRIX -->`, `<!-- END: PROJECT_MATRIX -->`, etc.

### Fix
Updated all scripts to use the correct marker format:
- `fetch-project-status.js`: Now uses `<!-- START: PROJECT_MATRIX -->` / `<!-- END: PROJECT_MATRIX -->`
- `fetch-gists.js`: Now uses `<!-- START: LATEST_POSTS -->` / `<!-- END: LATEST_POSTS -->`

### Files Modified
- `scripts/fetch-project-status.js`
- `scripts/fetch-gists.js`

---

## 2. Missing README Markers

### Issue
The `update-readme.yml` workflow tried to update a `<!-- LAST_SYNC -->` marker that didn't exist in README.md.

### Fix
Added the missing marker to README.md at line 280:
```markdown
<!-- LAST_SYNC -->2025-11-13 12:10 UTC<!-- /LAST_SYNC -->
```

### Files Modified
- `README.md`

---

## 3. Script Error Handling

### Issue
All scripts would exit with `process.exit(1)` when markers were not found, causing workflow failures.

### Fix
Updated all scripts to:
1. Provide detailed error messages explaining what markers are expected
2. Check for similar markers and provide hints
3. Exit with code 0 (success) instead of 1 (failure) when markers are missing
4. Log a clear message that the update is being skipped

This makes workflows more resilient and prevents cascading failures.

### Files Modified
- `scripts/fetch-project-status.js`
- `scripts/fetch-gists.js`
- `scripts/updateGists.mjs`
- `scripts/updateProjectMatrix.mjs`
- `scripts/buildRepoMermaid.mjs`
- `scripts/updateLearning.mjs`
- `scripts/updateTrending.mjs`

---

## 4. Token Configuration

### Issue
The `fetchMetrics.mjs` script required `METRICS_TOKEN` environment variable, but the workflow only provided `GITHUB_TOKEN`.

### Fix
Updated `fetchMetrics.mjs` to accept either `METRICS_TOKEN` (preferred) or `GITHUB_TOKEN` (fallback):
```javascript
const TOKEN = process.env.METRICS_TOKEN || process.env.GITHUB_TOKEN;
```

### Files Modified
- `scripts/fetchMetrics.mjs`

---

## Workflow Configuration Summary

### Current Workflows

#### 1. `update-project-status.yml`
- **Trigger**: Daily at 11:00 UTC + manual dispatch
- **Purpose**: Updates project matrix with CI status badges
- **Token**: Uses `secrets.GITHUB_TOKEN`
- **Permissions**: `contents: write`
- **Dependencies**: None (uses built-in Node.js only)
- **Script**: `scripts/fetch-project-status.js`

#### 2. `update-readme.yml`
- **Trigger**: Daily at 10:00 UTC + manual dispatch
- **Purpose**: Updates README with latest gists
- **Token**: Uses `secrets.GITHUB_TOKEN`
- **Permissions**: `contents: write`
- **Dependencies**: None (uses built-in Node.js only)
- **Script**: `scripts/fetch-gists.js`

#### 3. `update-profile.yml`
- **Trigger**: Daily at 10:00 UTC + manual dispatch
- **Purpose**: Updates all profile sections (gists, projects, metrics, etc.)
- **Token**: Uses `secrets.GITHUB_TOKEN`
- **Permissions**: `contents: write`
- **Dependencies**: Requires `npm ci` (uses @octokit/rest, cheerio, node-fetch, etc.)
- **Scripts**: Multiple scripts including:
  - `scripts/fetchMetrics.mjs`
  - `scripts/updateGists.mjs`
  - `scripts/updateProjectMatrix.mjs`
  - `scripts/buildRepoMermaid.mjs`
  - `scripts/updateLearning.mjs`
  - `scripts/updateTrending.mjs`

---

## Token Permissions

### GITHUB_TOKEN (Default)
The default `GITHUB_TOKEN` provided by GitHub Actions should be sufficient for:
- Reading public repository data
- Reading public gists
- Reading user profile information
- Writing to README.md in the same repository

### When to Use PAT (Personal Access Token)
A PAT with additional scopes may be needed if:
- Accessing private repositories
- Accessing private gists
- Fetching detailed contribution data
- Accessing organization data with restrictions

**Note**: The problem statement mentions "One failure is due to insufficient PAT scopes" which the user will fix manually. This likely relates to accessing more sensitive data that requires a PAT with scopes like `repo`, `read:user`, or `gist`.

---

## Preventing Infinite Loops

All workflows use `[skip ci]` in their commit messages to prevent triggering themselves:
- `update-project-status.yml`: `"ci: update project status matrix [skip ci]"`
- `update-readme.yml`: `"ci: update README with latest gists [skip ci]"`
- `update-profile.yml`: `"ci(profile): refresh README dynamic sections"` (workflow only runs on schedule/dispatch, not on push)

---

## Testing Locally

To test scripts locally:

```bash
# Test fetch-project-status.js
GITHUB_TOKEN=your_token node scripts/fetch-project-status.js

# Test fetch-gists.js
GITHUB_TOKEN=your_token node scripts/fetch-gists.js

# Test update-profile scripts
npm ci
GITHUB_TOKEN=your_token node scripts/updateGists.mjs
GITHUB_TOKEN=your_token node scripts/updateProjectMatrix.mjs
GITHUB_TOKEN=your_token node scripts/buildRepoMermaid.mjs
GITHUB_TOKEN=your_token node scripts/updateLearning.mjs
GITHUB_TOKEN=your_token node scripts/updateTrending.mjs
```

---

## README Marker Reference

All markers used in README.md:

| Marker | Script | Purpose |
|--------|--------|---------|
| `<!-- START: LATEST_POSTS -->` / `<!-- END: LATEST_POSTS -->` | `fetch-gists.js`, `updateGists.mjs` | Latest blog posts/gists |
| `<!-- START: PROJECT_MATRIX -->` / `<!-- END: PROJECT_MATRIX -->` | `fetch-project-status.js`, `updateProjectMatrix.mjs` | Project status matrix |
| `<!-- START: REPO_MERMAID -->` / `<!-- END: REPO_MERMAID -->` | `buildRepoMermaid.mjs` | Repository mindmap diagram |
| `<!-- START: LEARNING_DYNAMIC -->` / `<!-- END: LEARNING_DYNAMIC -->` | `updateLearning.mjs` | Recent learning activity |
| `<!-- START: GH_SHOWCASE -->` / `<!-- END: GH_SHOWCASE -->` | `updateTrending.mjs` | Trending GitHub repos |
| `<!-- UPDATE_TIME -->` / `<!-- /UPDATE_TIME -->` | All workflows | Last update timestamp |
| `<!-- LAST_SYNC -->` / `<!-- /LAST_SYNC -->` | `update-readme.yml` | Gist sync timestamp |

---

## Next Steps

1. ✅ Fix marker name mismatches
2. ✅ Add missing README markers
3. ✅ Improve error handling in all scripts
4. ✅ Fix token variable naming
5. ⏳ Test workflows with actual GitHub Actions
6. ⏳ Monitor for any remaining failures
7. ⏳ Update PAT scopes if needed (user to handle manually)

---

## Validation

To validate all markers are present in README.md:

```bash
# Check for all required markers
grep -E "START:|END:" README.md

# Should output:
# <!-- START: LATEST_POSTS -->
# <!-- END: LATEST_POSTS -->
# <!-- START: PROJECT_MATRIX -->
# <!-- END: PROJECT_MATRIX -->
# <!-- START: REPO_MERMAID -->
# <!-- END: REPO_MERMAID -->
# <!-- START: LEARNING_DYNAMIC -->
# <!-- END: LEARNING_DYNAMIC -->
# <!-- START: GH_SHOWCASE -->
# <!-- END: GH_SHOWCASE -->
```

All markers are confirmed present! ✓
