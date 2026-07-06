#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');
const HISTORY_PATH = join(process.cwd(), 'data', 'daily-digists.json');
const ENTRIES_TO_DISPLAY = 5;

function truncate(text, maxLength = 96) {
  if (!text) return 'No summary available';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

async function loadHistory() {
  try {
    const content = await readFile(HISTORY_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensureHistory(entries) {
  await mkdir(dirname(HISTORY_PATH), { recursive: true });
  await writeFile(HISTORY_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

function buildTable(entries) {
  if (entries.length === 0) {
    return '| Date | Title | Summary | Source |\n|------|-------|---------|--------|\n| Pending | Awaiting first scheduled Daily Di-Gist | The 03:00 public-repo digest workflow will publish the first report after merge. | — |';
  }

  return entries.slice(0, ENTRIES_TO_DISPLAY).map((entry) => {
    const source = entry.path ? `[View Digest](${entry.path})` : '—';
    return `| ${entry.date || 'Unknown'} | ${truncate(entry.title, 72)} | ${truncate(entry.summary, 96)} | ${source} |`;
  }).join('\n');
}

async function updateReadme(table) {
  const readme = await readFile(README_PATH, 'utf8');
  const startMarker = '<!-- START: LATEST_POSTS -->';
  const endMarker = '<!-- END: LATEST_POSTS -->';
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('README latest-post markers are missing');
  }

  const header = '| Date | Title | Summary | Source |\n|------|-------|---------|--------|';
  const replacement = `${startMarker}\n${header}\n${table}\n${endMarker}`;
  const updated = `${readme.slice(0, startIndex)}${replacement}${readme.slice(endIndex + endMarker.length)}`;
  await writeFile(README_PATH, updated, 'utf8');
}

async function main() {
  const entries = await loadHistory();
  await ensureHistory(entries);
  await updateReadme(buildTable(entries));
  console.log(`✓ Updated Latest Blog Posts from ${entries.length} Daily Di-Gist entr${entries.length === 1 ? 'y' : 'ies'}`);
}

main().catch((error) => {
  console.error('Error updating Latest Blog Posts:', error.message);
  process.exit(1);
});
