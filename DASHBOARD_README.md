# CYWF Analytics Dashboard

A Grafana-style analytics dashboard built with Next.js 14+ that displays GitHub activity metrics and daily intelligence briefs. Deployed to GitHub Pages with automated data refreshes.

## 🚀 Features

### Analytics & Visualizations
- **Grafana-Style UI**: Dark neon-green cyber aesthetic with high-contrast, WCAG AA compliant design
- **GitHub Analytics**: Real-time visualization of contributions, repositories, languages, and activity patterns
- **Public Contributions**: Tracks contributions to both owned AND other public repositories
- **Activity Ratio Chart**: Donut chart showing PRs vs Issues vs Commits distribution
- **Monthly Trends**: Stacked bar chart displaying activity over the last 12 months
- **Activity by Hour**: Enhanced chart with alternating bar shades for better readability
- **Language Distribution**: Color-coded by language using GitHub Linguist colors

### Interactive Features
- **Mermaid Playground**: Create and render diagrams (Flowchart, Mind Map, ER, C4)
- **Latest Gists**: Scrollable panel with modal preview of your public gists
- **Daily Brief**: Configurable panel for custom Markdown/HTML content
- **Quote of the Day**: Inspirational quotes from ZenQuotes or Quotable API

### Technical Features
- **Responsive Design**: Mobile-friendly layout with adaptive grid system
- **Static Export**: Full static site generation for GitHub Pages deployment
- **Automated Refresh**: Metrics update every ~30 minutes via GitHub Actions
- **No Tokens in Browser**: All API calls are server-side; static JSON files served to client
- **Stale-While-Revalidate**: Smart caching for better performance

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, Static Export)
- **Language**: TypeScript
- **Charts**: Apache ECharts via echarts-for-react
- **Data**: GitHub GraphQL API, RSS Parser
- **Diagrams**: Mermaid (loaded from CDN)
- **Styling**: CSS Modules with custom properties
- **Deployment**: GitHub Pages via GitHub Actions

## 📦 Installation

### Prerequisites

- Node.js 20+ 
- npm or yarn
- GitHub Personal Access Token (for fetching analytics)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/cywf/cywf.git
   cd cywf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Optional: Create .env.local for local development
   echo "GITHUB_TOKEN=your_github_token_here" > .env.local
   echo "GITHUB_USERNAME=cywf" >> .env.local
   ```

4. **Fetch initial data** (optional, uses mock data if skipped)
   ```bash
   npm run fetch:all
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to `http://localhost:3000/cywf`

## 🔧 Configuration

### GitHub Token

For fetching analytics data, you need a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate a new token with these scopes:
   - `read:user` - Read user profile data
   - `public_repo` - Access public repositories
3. Add token to repository secrets as `GITHUB_TOKEN`

### RSS Feeds

Edit `config/feeds.yml` to customize the intelligence brief sources:

```yaml
feeds:
  - name: "Source Name"
    url: "https://example.com/feed.xml"
    tags: ["tag1", "tag2"]
    maxItems: 10
```

## 📊 Data Scripts

### Fetch GitHub Analytics

```bash
npm run fetch:analytics
```

Fetches public GitHub contribution data using GraphQL API:
- Contribution calendar (365 days)
- Commit, PR, Issue, Review counts
- Repository statistics
- Language distribution

Output: `public/data/github-analytics.json`

### Fetch RSS Briefs

```bash
npm run fetch:rss
```

Aggregates RSS feeds from configured sources:
- Deduplicates items by hash
- Sanitizes HTML content
- Groups by tags
- Limits items per source

Output: `public/data/daily-brief.json`

### Fetch All

```bash
npm run fetch:all
```

Runs both analytics and RSS fetching scripts.

## 🏗️ Build & Deploy

### Local Build

```bash
npm run build
```

Generates static site in `out/` directory with:
- Optimized assets
- Static HTML pages
- JSON data files

### Manual Deploy

The build is automatically deployed via GitHub Actions, but you can deploy manually:

1. Build the site: `npm run build`
2. The `out/` directory contains the static site
3. Deploy to any static hosting (GitHub Pages, Netlify, Vercel, etc.)

## 🤖 GitHub Actions Workflows

### Pages Deploy (`pages-deploy.yml`)

**Triggers**: Push to `main`, Manual dispatch

**Steps**:
1. Checkout code
2. Install dependencies
3. Fetch analytics & briefs
4. Build Next.js site
5. Upload Pages artifact
6. Deploy to GitHub Pages

**Permissions**:
- `contents: read`
- `pages: write`
- `id-token: write`

### Daily Refresh (`daily-refresh.yml`)

**Triggers**: 
- Cron: `30 9 * * *` (05:30 EDT)
- Cron: `30 10 * * *` (05:30 EST)
- Manual dispatch

**DST Handling**: 
Uses dual cron schedules with a timezone guard that checks if the current time in `America/New_York` is exactly `05:30`. This ensures the workflow runs once daily at 05:30 ET regardless of DST.

**Steps**:
1. Check if current time is 05:30 ET
2. Fetch fresh analytics & briefs
3. Commit changes if data updated
4. Rebuild and redeploy site

## 🎨 Theme Customization

The neon-green cyber theme is defined in `styles/tokens.css`:

```css
:root {
  --bg-0: hsl(200, 20%, 3%);        /* Deep background */
  --bg-panel: hsl(165, 20%, 8%);    /* Panel background */
  --fg: hsl(145, 45%, 93%);         /* Primary text */
  --acc-1: hsl(150, 98%, 58%);      /* Neon green accent */
  --acc-2: hsl(145, 100%, 81%);     /* Light green accent */
}
```

All colors maintain WCAG AA contrast ratios (≥4.5:1 for body text).

## ♿ Accessibility

- **WCAG AA Compliant**: All text meets contrast ratio requirements
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Semantic HTML**: Proper heading hierarchy and ARIA labels
- **Screen Reader Friendly**: Descriptive labels and alt text

## 📱 Pages

### Dashboard (`/`)

Main analytics dashboard featuring:
- KPI cards (Stars, Commits, PRs, Streak)
- Contribution heatmap (365 days)
- Activity by hour chart
- Top repositories by stars
- Language distribution

### Intel Briefs (`/intel`)

Daily intelligence brief page with:
- RSS feed aggregation
- Grouped by tags/categories
- Download as JSON
- Source attribution

## 🔐 Security & Privacy

- **Public Data Only**: Only displays public GitHub contributions
- **No Private Data**: Excludes `restrictedContributionsCount`
- **Sanitized Content**: RSS feeds are sanitized before display
- **No Tracking**: No analytics or tracking scripts
- **Secure Tokens**: GitHub tokens stored as repository secrets

## 🐛 Troubleshooting

### Build Fails

- Ensure Node.js 20+ is installed
- Clear cache: `rm -rf .next out .cache`
- Reinstall: `rm -rf node_modules && npm install`

### Data Not Loading

- Check `public/data/` directory exists
- Run `npm run fetch:all` to generate data
- Verify GitHub token has correct permissions

### GitHub Pages 404

- Ensure `basePath: "/cywf"` in `next.config.mjs`
- Check `.nojekyll` file exists in `public/`
- Verify GitHub Pages is enabled in repository settings

### Workflow Not Running at 05:30 ET

- Check workflow run logs in Actions tab
- Verify the timezone guard logic in `daily-refresh.yml`
- DST transitions may cause temporary delays

## 📝 Scripts Reference

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server (not used for static export)
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run fetch:analytics  # Fetch GitHub analytics
npm run fetch:rss    # Fetch RSS briefs
npm run fetch:all    # Fetch all data
```

## 🔄 Data Build Pipeline

The dashboard includes a scheduled GitHub Action that automatically fetches and updates metrics data every 30 minutes (at :17 and :47 past each hour).

### Metrics Workflow

Located at `.github/workflows/metrics.yml`, this workflow:

1. Runs on a schedule: `17,47 * * * *` (every 30 minutes)
2. Can be manually triggered via `workflow_dispatch`
3. Executes `scripts/fetchMetrics.mjs` to fetch GitHub data
4. Commits and pushes updated JSON files to `public/data/`
5. Triggers a rebuild of the static site

### Configuration

Set these environment variables and secrets in your repository settings:

| Variable/Secret | Type | Description | Required |
|----------------|------|-------------|----------|
| `GH_LOGIN` | Variable | Your GitHub username (e.g., "cywf") | Yes |
| `METRICS_TOKEN` | Secret | GitHub Personal Access Token with `read:user`, `read:gist`, `public_repo` scopes | Yes |
| `DAILY_BRIEF_URL` | Variable | URL to a Markdown/HTML file for the Daily Brief section (optional) | No |
| `QOTD_SOURCE` | Variable | Quote source: `"zenquotes"` (default) or `"quotable"` | No |

### Generated Data Files

The workflow generates the following files in `public/data/`:

- **`metrics.json`** - GitHub activity metrics including:
  - Tallies (commits, PRs, issues, reviews)
  - Top repositories by stars (owned + public contributions)
  - Monthly time series data
  - Activity by hour
  - Language distribution
  - Contribution calendar

- **`gists.json`** - Latest public gists with previews

- **`qotd.json`** - Quote of the Day from ZenQuotes or Quotable API

- **`daily-brief.html`** or **`daily-brief.md`** - Custom daily brief content (if configured)

## 🔒 Privacy & Security Notes

### Public Data Only

- **Owned Repositories**: Only PUBLIC repositories are included in analytics
- **Contributed Repositories**: Only PUBLIC repositories you've contributed to are shown
- **Private Contributions**: The API may return `restrictedContributionsCount` for private activity, but NO DETAILS are displayed
- **Gists**: Only PUBLIC gists are fetched and displayed

### No Tokens in Browser

- All API calls with authentication are made server-side via GitHub Actions
- The browser only fetches static JSON files from `public/data/`
- No GitHub tokens or secrets are exposed to the client

### Data Freshness

- Metrics are refreshed every ~30 minutes via the scheduled workflow
- The dashboard displays a "Last updated" timestamp from `generatedAt` field
- Stale data may be shown if the workflow fails; check Actions tab for errors

## 🤝 Contributing

This is a personal dashboard, but suggestions and bug reports are welcome via GitHub Issues.

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **Live Site**: https://cywf.github.io/cywf/
- **Repository**: https://github.com/cywf/cywf
- **GitHub Profile**: https://github.com/cywf

---

**Last Updated**: November 2025
**Maintained By**: [@cywf](https://github.com/cywf)
