#!/usr/bin/env node

import fetch from 'node-fetch';
import { load } from 'cheerio';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');

async function fetchTrending() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.CYWF_API_TIMEOUT_MS || 10000));
  const response = await fetch('https://github.com/trending?since=daily', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; cywf-bot/1.0)',
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = load(html);
  const repos = [];

  $('article.Box-row').each((index, element) => {
    if (repos.length >= 3) return false;
    const link = $(element).find('h2 a').attr('href');
    if (!link) return;

    const parts = link.split('/').filter(Boolean);
    const owner = parts[0];
    const repo = parts[1];
    const description = $(element).find('p').first().text().replace(/\s+/g, ' ').trim() || 'No description available';
    const language = $(element).find('[itemprop="programmingLanguage"]').text().trim() || 'Unknown';
    const starsToday = $(element).find('span.d-inline-block.float-sm-right').text().replace(/\s+/g, ' ').trim() || 'Unavailable';

    repos.push({
      rank: index + 1,
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
      language,
      starsToday,
      description: description.length > 100 ? `${description.slice(0, 99).trimEnd()}…` : description,
    });
  });

  if (repos.length === 0) {
    throw new Error('No trending repositories parsed from GitHub HTML');
  }

  return repos;
}

function buildTable(repos) {
  return [
    '<!-- START: GH_SHOWCASE -->',
    '| Rank | Repository | Language | Stars today | Description |',
    '|------|------------|----------|-------------|-------------|',
    ...repos.map((repo) => `| ${repo.rank} | [${repo.owner}/${repo.repo}](${repo.url}) | ${repo.language} | ${repo.starsToday} | ${repo.description} |`),
    '<!-- END: GH_SHOWCASE -->',
  ].join('\n');
}

async function updateReadme(table) {
  const readme = await readFile(README_PATH, 'utf8');
  const startMarker = '<!-- START: GH_SHOWCASE -->';
  const endMarker = '<!-- END: GH_SHOWCASE -->';
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('GH_SHOWCASE markers missing from README');
  }

  const updated = `${readme.slice(0, startIndex)}${table}${readme.slice(endIndex + endMarker.length)}`;
  await writeFile(README_PATH, updated, 'utf8');
}

async function main() {
  const repos = await fetchTrending();
  await updateReadme(buildTable(repos));
  console.log(`✓ GitHub showcase updated with ${repos.length} trending repositories`);
}

main().catch(async (error) => {
  console.warn(`⚠ GitHub showcase refresh degraded: ${error.message}`);
  console.warn('Keeping existing GH_SHOWCASE block so the daily pipeline can continue.');
});
