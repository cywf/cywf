# Phase 2 – Script Development Tasks

## Orchestrator & shared utilities
- [ ] Implement `scripts/daily/generate-daily-brief.js` to orchestrate data collection, rendering, README update, and archive writing.
- [ ] Ensure directories (`assets/daily`, `daily`) are created dynamically when missing.
- [ ] Integrate structured logging and central error handling with graceful degradation.

## Data collectors
- [ ] Build `lib/weather.js` to query OpenWeatherMap (current + forecast) for Puerto Rico with retries and formatting helpers.
- [ ] Build `lib/news.js` to parse Reuters/Stratfor RSS feeds and return top 5 stories with timestamps.
- [ ] Build `lib/space-weather.js` to pull NOAA SWPC alerts and KP index data, mapping severity to labels/emojis.
- [ ] Build `lib/quote.js` for ZenQuotes daily quote with fallback cache.
- [ ] Build `lib/github-trending.js` to fetch top 3 trending repos (HTML scrape or API) with rate limit handling.

## Visual generation
- [ ] Create `lib/visuals.js` using Puppeteer to capture weather/GRINTSUM screenshots and save to dated PNG files under `assets/daily/`.
- [ ] (Optional) Integrate `sharp` to optimize PNG size before embedding.

## Rendering & archive
- [ ] Create `lib/render.js` that assembles nested `<details>/<summary>` Markdown, centered date header, tables, and image embeds.
- [ ] Create `lib/archive.js` to write `daily/YYYY-MM-DD.md` with YAML front matter and content from renderer.

## Support files
- [ ] Add Markdown templates to `scripts/daily/templates/` for README snippet and archive layout (Mustache/Handlebars friendly).
- [ ] Add retry helper or reuse `p-retry` for API calls with shared configuration.
- [ ] Write unit or smoke tests (where feasible) for key formatters (optional but recommended).
