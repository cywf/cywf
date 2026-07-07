// G8S TID-129 — Developer Analytics generator.
// Pulls GitHub stats for USERNAME, builds a json-render spec from the guardrailed
// catalog, and renders a self-contained SVG the README embeds. Runs in CI
// (see .github/workflows/dev-analytics.yml) with GITHUB_TOKEN in the environment.
//
// Design note: json-render gives us a *predictable* spec — the model/data can
// only fill values into the fixed catalog components, so the render can never
// produce arbitrary/unsafe markup.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToSvg } from "@json-render/image/render";
import { theme } from "./catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERNAME = process.env.GH_USERNAME || "cywf";
const TOKEN = process.env.GITHUB_TOKEN || "";
const OUT_SVG = path.join(__dirname, "dev-analytics.svg");
const README = path.join(__dirname, "..", "README.md");
const START = "<!-- DEV-ANALYTICS:START -->";
const END = "<!-- DEV-ANALYTICS:END -->";

const gh = async (url) => {
  const res = await fetch(`https://api.github.com${url}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "cywf-dev-analytics",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${url} -> ${res.status}`);
  return res.json();
};

async function collectStats() {
  const user = await gh(`/users/${USERNAME}`);
  let repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh(`/users/${USERNAME}/repos?per_page=100&page=${page}&sort=pushed`);
    repos = repos.concat(batch);
    if (batch.length < 100) break;
  }
  const owned = repos.filter((r) => !r.fork);
  const stars = owned.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const forks = owned.reduce((s, r) => s + (r.forks_count || 0), 0);

  const langCount = {};
  for (const r of owned) if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  const topLangs = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const langTotal = topLangs.reduce((s, [, n]) => s + n, 0) || 1;

  return {
    name: user.name || USERNAME,
    followers: user.followers || 0,
    publicRepos: user.public_repos || owned.length,
    stars,
    forks,
    topLangs: topLangs.map(([lang, n]) => ({ lang, pct: Math.round((n / langTotal) * 100) })),
    updated: new Date().toISOString().slice(0, 10),
  };
}

function buildSpec(s) {
  const W = 760, H = 300;
  const el = {};
  const id = (() => { let i = 0; return () => `n${++i}`; })();
  const add = (node) => { const k = id(); el[k] = node; return k; };

  const metric = (label, value) => {
    const v = add({ type: "Text", props: { text: String(value), color: theme.text, size: 26, weight: 700 }, children: [] });
    const l = add({ type: "Text", props: { text: label, color: theme.muted, size: 12 }, children: [] });
    return add({ type: "Stack", props: { direction: "column", gap: 2 }, children: [v, l] });
  };

  const bar = (lang, pct) => {
    const fill = add({ type: "Box", props: { width: Math.max(6, pct * 4), height: 10, backgroundColor: theme.accent, borderRadius: 5 }, children: [] });
    const track = add({ type: "Box", props: { width: 420, height: 10, backgroundColor: theme.border, borderRadius: 5 }, children: [fill] });
    const label = add({ type: "Text", props: { text: `${lang}  ${pct}%`, color: theme.muted, size: 12 }, children: [] });
    return add({ type: "Stack", props: { direction: "column", gap: 4 }, children: [label, track] });
  };

  const title = add({ type: "Heading", props: { text: "Developer Analytics", level: "h2", color: theme.text }, children: [] });
  const sub = add({ type: "Text", props: { text: `@${USERNAME} · updated ${s.updated}`, color: theme.muted, size: 12 }, children: [] });
  const metrics = add({
    type: "Stack",
    props: { direction: "row", gap: 34 },
    children: [
      metric("Public repos", s.publicRepos),
      metric("Stars", s.stars),
      metric("Forks", s.forks),
      metric("Followers", s.followers),
    ],
  });
  const langHeading = add({ type: "Text", props: { text: "Top languages", color: theme.text, size: 14, weight: 600 }, children: [] });
  const bars = add({ type: "Stack", props: { direction: "column", gap: 8 }, children: s.topLangs.map((l) => bar(l.lang, l.pct)) });

  const body = add({
    type: "Stack",
    props: { direction: "column", gap: 18, padding: 28 },
    children: [title, sub, metrics, langHeading, bars],
  });
  const root = add({
    type: "Frame",
    props: { width: W, height: H, backgroundColor: theme.panel, borderRadius: 12 },
    children: [body],
  });
  return { root, elements: el };
}

async function fetchFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const stats = await collectStats();
  const spec = buildSpec(stats);
  const [regular, bold] = await Promise.all([
    fetchFont("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff"),
    fetchFont("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff"),
  ]);
  const svg = await renderToSvg(spec, {
    fonts: [
      { name: "Inter", data: regular, weight: 400, style: "normal" },
      { name: "Inter", data: bold, weight: 700, style: "normal" },
    ],
  });
  await fs.writeFile(OUT_SVG, svg, "utf8");
  console.log(`Wrote ${OUT_SVG}`);

  try {
    let md = await fs.readFile(README, "utf8");
    const block = `${START}\n<p align="center"><img src="dev-analytics/dev-analytics.svg" alt="Developer Analytics" width="760"></p>\n${END}`;
    if (md.includes(START) && md.includes(END)) {
      md = md.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
    } else {
      md += `\n\n${block}\n`;
    }
    await fs.writeFile(README, md, "utf8");
    console.log("Updated README analytics block.");
  } catch (e) {
    console.warn("README not updated:", e.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
