#!/usr/bin/env node

/**
 * Update Latest Blog Posts (Gists)
 * Fetches 5 rotating public gists and updates the README.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const OWNER = 'cywf';
const README_PATH = join(process.cwd(), 'README.md');
const HISTORY_PATH = join(process.cwd(), 'data', 'gists-history.json');
const GISTS_TO_DISPLAY = 5;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

function truncate(text, maxLength = 80) {
  if (!text) return 'No description available';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

async function loadHistory() {
  try {
    const content = await readFile(HISTORY_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { lastUpdate: null, previousGistIds: [] };
  }
}

async function saveHistory(history) {
  await mkdir(dirname(HISTORY_PATH), { recursive: true });
  await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n', 'utf8');
}

async function fetchGists() {
  const headers = {
    'User-Agent': 'cywf-profile-bot/1.0',
    Accept: 'application/vnd.github+json',
  };

  const tryUrls = [
    { url: `https://api.github.com/users/${OWNER}/gists?per_page=100`, useAuth: Boolean(GITHUB_TOKEN) },
    { url: `https://api.github.com/users/${OWNER}/gists?per_page=100`, useAuth: false },
  ];

  for (const attempt of tryUrls) {
    try {
      const response = await fetch(attempt.url, {
        headers: {
          ...headers,
          ...(attempt.useAuth ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) return data;
    } catch (error) {
      if (!attempt.useAuth) throw error;
    }
  }

  return [];
}

function selectGists(gists, previousIds) {
  const unused = gists.filter((gist) => !previousIds.includes(gist.id));
  const used = gists.filter((gist) => previousIds.includes(gist.id));
  const pool = [...unused, ...used];

  pool.sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, GISTS_TO_DISPLAY);
  selected.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return selected;
}

function generateGistTable(gists) {
  return gists
    .map((gist) => {
      const date = formatDate(gist.updated_at);
      const files = Object.keys(gist.files || {});
      const filename = files[0] || 'Untitled';
      const title = truncate(gist.description || filename, 70);
      const summary = truncate(gist.description || 'No description available', 90);
      return `| ${date} | ${title} | ${summary} | [View Gist](${gist.html_url}) |`;
    })
    .join('\n');
}

async function updateReadme(gistTable) {
  const readme = await readFile(README_PATH, 'utf8');
  const startMarker = '<!-- START: LATEST_POSTS -->';
  const endMarker = '<!-- END: LATEST_POSTS -->';
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.log('Skipping gist update because README markers are missing.');
    process.exit(0);
  }

  const tableHeader = '| Date | Title | Summary | Source |\n|------|-------|---------|--------|';
  const replacement = `${startMarker}\n${tableHeader}\n${gistTable}\n${endMarker}`;
  const updated = `${readme.slice(0, startIndex)}${replacement}${readme.slice(endIndex + endMarker.length)}`;
  await writeFile(README_PATH, updated, 'utf8');
}

async function main() {
  const history = await loadHistory();
  const gists = await fetchGists();

  if (gists.length === 0) {
    console.log('No gists available; leaving README unchanged.');
    return;
  }

  const selected = selectGists(gists, history.previousGistIds || []);
  await updateReadme(generateGistTable(selected));
  await saveHistory({
    lastUpdate: new Date().toISOString(),
    previousGistIds: selected.map((gist) => gist.id),
  });

  console.log(`✓ Updated gist section with ${selected.length} entries`);
}

main().catch((error) => {
  console.error('Error updating gists:', error.message);
  process.exit(1);
});
