# Developer Analytics (json-render) — G8S TID-129

A [json-render](https://github.com/vercel-labs/json-render)-powered analytics card for the
`cywf/cywf` profile README. GitHub stats are pulled in CI, mapped onto a small guardrailed
component catalog, and rendered to a self-contained SVG — so the output is always predictable
and safe to embed.

## How it works

```
GitHub REST API --> collectStats() --> json-render spec --> renderToSvg() --> dev-analytics.svg
                    (catalog = Frame/Stack/Heading/Text/Box only)
```

- `catalog.mjs` — the fixed component catalog + design tokens.
- `generate.mjs` — fetches stats, builds the spec, renders the SVG, splices it into the README
  between the `<!-- DEV-ANALYTICS:START -->` / `:END` markers.
- `../.github/workflows/dev-analytics.yml` — runs it on a schedule and on demand, commits the
  refreshed SVG.

## Run locally

```bash
cd dev-analytics
npm install
GH_USERNAME=cywf GITHUB_TOKEN=<token> npm run generate
```

## Roadmap

- TID-130 will extend the same catalog to render per-repo GitHub Actions workflow diagrams
  (all repos) and n8n workflow diagrams (private repos only, gated at generation time).
