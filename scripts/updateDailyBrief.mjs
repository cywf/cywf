#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import Parser from 'rss-parser';

const README_PATH = join(process.cwd(), 'README.md');
const DAILY_DIR = join(process.cwd(), 'daily');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const parser = new Parser({ timeout: 15000 });

const LOCATION = {
  name: 'Rifle, Colorado',
  latitude: 39.5347,
  longitude: -107.7831,
  timezone: 'America/Denver',
};

function truncate(text, max = 180) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function codeToEmoji(code) {
  if ([0].includes(code)) return '☀️';
  if ([1, 2].includes(code)) return '⛅';
  if ([3].includes(code)) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌤️';
}

function kIndexStatus(kp) {
  if (kp < 4) return '🟢 Quiet';
  if (kp < 5) return '🟡 Unsettled';
  if (kp < 6) return '🟠 Active';
  return '🔴 Storm';
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'cywf-profile-bot/1.0',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'cywf-profile-bot/1.0',
      Accept: 'application/json, text/plain, text/xml, application/xml',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

async function fetchQuote() {
  try {
    const data = await fetchJson('https://zenquotes.io/api/today');
    const item = Array.isArray(data) ? data[0] : data;
    if (!item?.q) throw new Error('Quote payload missing q');
    return {
      text: item.q,
      author: item.a || 'Unknown',
      fallback: false,
    };
  } catch (error) {
    return {
      text: 'Automated quote source unavailable at refresh time.',
      author: 'System status',
      fallback: true,
    };
  }
}

async function fetchWeather() {
  const url = [
    'https://api.open-meteo.com/v1/forecast',
    `?latitude=${LOCATION.latitude}`,
    `&longitude=${LOCATION.longitude}`,
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
    `&timezone=${encodeURIComponent(LOCATION.timezone)}`,
    '&temperature_unit=fahrenheit',
    '&wind_speed_unit=mph',
  ].join('');

  try {
    const data = await fetchJson(url);
    const current = data.current || {};
    const daily = data.daily || {};
    return {
      location: LOCATION.name,
      temperature: Math.round(current.temperature_2m ?? 0),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      wind: Math.round(current.wind_speed_10m ?? 0),
      high: Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m ?? 0),
      low: Math.round(daily.temperature_2m_min?.[0] ?? current.temperature_2m ?? 0),
      precipitation: Math.round(daily.precipitation_probability_max?.[0] ?? 0),
      emoji: codeToEmoji(current.weather_code ?? daily.weather_code?.[0] ?? -1),
      unavailable: false,
    };
  } catch (error) {
    return {
      location: LOCATION.name,
      unavailable: true,
      error: error.message,
    };
  }
}

async function fetchSpaceWeather() {
  try {
    const rows = await fetchJson('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const latest = [...rows].reverse().find((row) => Array.isArray(row) && !Number.isNaN(Number(row[1])));
    const kp = latest ? Number(latest[1]) : null;
    if (kp === null) throw new Error('No KP row found');
    return {
      kp,
      status: kIndexStatus(kp),
      alerts: kp >= 5 ? 'Minor geomagnetic storm conditions detected.' : 'No active geomagnetic storm alerts.',
      unavailable: false,
    };
  } catch (error) {
    return {
      unavailable: true,
      alerts: 'Space weather feed unavailable.',
    };
  }
}

async function fetchRssItems(query, limit = 3) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, limit).map((item) => ({
    title: truncate(item.title || 'Untitled', 110),
    summary: truncate(item.contentSnippet || item.content || item.title || '', 200),
  }));
}

async function fetchNews() {
  const [worldResult, cyberResult] = await Promise.allSettled([
    fetchRssItems('world news when:1d'),
    fetchRssItems('cybersecurity when:1d'),
  ]);

  return {
    world: worldResult.status === 'fulfilled' && worldResult.value.length > 0 ? worldResult.value : [],
    cyber: cyberResult.status === 'fulfilled' && cyberResult.value.length > 0 ? cyberResult.value : [],
  };
}

function pickWorkflowBadge(workflows = [], owner, repo, branch = 'main') {
  const ignored = new Set(['copilot', 'pages-build-deployment']);
  const ranked = workflows.filter((wf) => !ignored.has((wf.path || '').split('/').pop()));
  const preferred = ranked.find((wf) => /test|ci|build|validate|security|deploy/i.test(`${wf.name} ${wf.path}`)) || ranked[0];
  if (!preferred) return null;
  const file = (preferred.path || '').split('/').pop();
  if (!file) return null;
  return `https://github.com/${owner}/${repo}/actions/workflows/${file}/badge.svg?branch=${branch}`;
}

async function fetchTrendingRepos() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceText = since.toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:%3E${sinceText}&sort=stars&order=desc&per_page=3`;
  const headers = {
    'User-Agent': 'cywf-profile-bot/1.0',
    Accept: 'application/vnd.github+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  try {
    const data = await fetchJson(url, { headers });
    return (data.items || []).slice(0, 3).map((repo) => ({
      repo: repo.name,
      author: repo.owner?.login || 'unknown',
      description: truncate(repo.description || 'No description available', 80),
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      url: repo.html_url,
    }));
  } catch (error) {
    return [];
  }
}

function buildBriefMarkdown({ now, quote, weather, spaceWeather, news, trendingRepos }) {
  const displayDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const displayTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });

  const worldSection = news.world.length
    ? news.world.map((item, index) => `${index + 1}. **${item.title}**\n   ${item.summary || 'Summary unavailable.'}`).join('\n\n')
    : '**Intel data unavailable** ⛔';

  const cyberSection = news.cyber.length
    ? news.cyber.map((item, index) => `${index + 1}. **${item.title}**\n   ${item.summary || 'Summary unavailable.'}`).join('\n\n')
    : '**CyberPulse data unavailable** ⛔';

  const trendingTable = trendingRepos.length
    ? trendingRepos.map((repo) => `| ${repo.repo} | ${repo.author} | ${repo.description} | ${repo.language} | ${repo.stars} ⭐ | ${repo.forks} 🔱 | [Link](${repo.url}) |`).join('\n')
    : '| Data unavailable | — | GitHub trending search unavailable during refresh | — | — | — | — |';

  const weatherLines = weather.unavailable
    ? [
        `- **Location**: ${LOCATION.name}`,
        '- **Current Conditions**: Weather feed unavailable',
        '- **Today\'s Forecast**: Weather feed unavailable',
      ]
    : [
        `- **Location**: ${weather.location}`,
        `- **Current Conditions**: ${weather.temperature}°F, Humidity: ${weather.humidity}%, Wind Speed: ${weather.wind} mph`,
        `- **Today\'s Forecast**: High ${weather.high}°F / Low ${weather.low}°F, Precipitation: ${weather.precipitation}% ${weather.emoji}`,
      ];

  const spaceWeatherLines = spaceWeather.unavailable
    ? ['- **KP Index**: Unavailable', `- **Recent Alerts**: ${spaceWeather.alerts}`]
    : [`- **KP Index**: ${spaceWeather.status} (${spaceWeather.kp})`, `- **Recent Alerts**: ${spaceWeather.alerts}`];

  return [
    '<!-- BEGIN DAILY BRIEF -->',
    '<details>',
    '<summary><b>📰 Today\'s Intelligence Brief</b></summary>',
    '',
    '<div align="center">',
    '',
    '# 📅 Daily Brief',
    '',
    `**[${displayDate}]**`,
    '',
    '</div>',
    '',
    '---',
    '',
    '<details>',
    '<summary><b>💭 Quote of the Day</b></summary>',
    '',
    '### 💭 Quote of the Day',
    '',
    `> "${quote.text}"`,
    '>',
    `> — **${quote.author}**`,
    '',
    '</details>',
    '',
    '<details>',
    '<summary><b>🌤️ Weather Report</b></summary>',
    '',
    '### 🌤️ Weather Report',
    '',
    ...weatherLines,
    '',
    '**Space Weather Status**:',
    ...spaceWeatherLines,
    '',
    '</details>',
    '',
    '<details>',
    '<summary><b>📰 Global Intelligence News</b></summary>',
    '',
    '### 📰 Global Intelligence News',
    '',
    worldSection,
    '',
    '</details>',
    '',
    '<details>',
    '<summary><b>🔐 Cyber Pulse Report</b></summary>',
    '',
    '### 🔐 Cyber Pulse Report',
    '',
    cyberSection,
    '',
    '</details>',
    '',
    '<details>',
    '<summary><b>🔥 Trending on GitHub</b></summary>',
    '',
    '### 🔥 Trending on GitHub',
    '',
    '| Repo | Author | Description | Language | Stars | Forks | Link |',
    '|------|--------|-------------|----------|-------|-------|------|',
    trendingTable,
    '',
    '![Trending Repos Chart](assets/trending.png)',
    '',
    '</details>',
    '',
    '---',
    '',
    '<div align="center">',
    '',
    `_Generated at ${displayTime} UTC_`,
    '',
    '</div>',
    '</details>',
    '<!-- END DAILY BRIEF -->',
    '',
  ].join('\n');
}

async function updateReadme(briefMarkdown, now) {
  const readme = await readFile(README_PATH, 'utf8');
  const begin = '<!-- BEGIN DAILY BRIEF -->';
  const end = '<!-- END DAILY BRIEF -->';
  const start = readme.indexOf(begin);
  const finish = readme.indexOf(end);

  let updated = readme;
  if (start !== -1 && finish !== -1 && finish > start) {
    updated = `${readme.slice(0, start)}${briefMarkdown}${readme.slice(finish + end.length)}`;
  } else {
    updated = `${readme.trimEnd()}\n\n## 📅 Daily Brief\n\n${briefMarkdown}`;
  }

  const timestamp = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
  updated = updated.replace(/<!-- UPDATE_TIME -->.*<!-- \/UPDATE_TIME -->/g, `<!-- UPDATE_TIME -->${timestamp}<!-- /UPDATE_TIME -->`);
  await writeFile(README_PATH, updated.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', 'utf8');
}

async function archiveBrief(briefMarkdown, now) {
  await mkdir(DAILY_DIR, { recursive: true });
  const dateText = now.toISOString().slice(0, 10);
  const humanDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const frontmatter = [
    '---',
    `date: ${dateText}`,
    `title: "Daily Brief - ${humanDate}"`,
    `generated: ${now.toISOString()}`,
    '---',
    '',
  ].join('\n');

  await writeFile(join(DAILY_DIR, `${dateText}.md`), `${frontmatter}${briefMarkdown}`, 'utf8');
}

async function main() {
  const now = new Date();
  const [quote, weather, spaceWeather, news, trendingRepos] = await Promise.all([
    fetchQuote(),
    fetchWeather(),
    fetchSpaceWeather(),
    fetchNews(),
    fetchTrendingRepos(),
  ]);

  const briefMarkdown = buildBriefMarkdown({ now, quote, weather, spaceWeather, news, trendingRepos });
  await updateReadme(briefMarkdown, now);
  await archiveBrief(briefMarkdown, now);
  console.log('✓ Daily Brief updated');
}

main().catch((error) => {
  console.error('Error updating Daily Brief:', error);
  process.exit(1);
});
