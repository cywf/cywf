#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchPublicRepoPortfolio } from './publicRepoData.mjs';

const README_PATH = join(process.cwd(), 'README.md');

function languageSummary(projects) {
  const counts = new Map();
  for (const project of projects) {
    counts.set(project.language, (counts.get(project.language) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([language, count]) => `${language} (${count})`)
    .join(', ');
}

function themeBlocks(projects) {
  const buckets = new Map();
  for (const project of projects) {
    for (const theme of project.themes) {
      if (!buckets.has(theme)) buckets.set(theme, []);
      buckets.get(theme).push(project);
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([theme, repos]) => {
      const repoLinks = repos.map((project) => `[${project.repo}](${project.html_url})`).join(', ');
      return `- **${theme}** — ${repoLinks}`;
    })
    .join('\n');
}

function buildLearningBlock(projects) {
  const newest = [...projects]
    .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))
    .slice(0, 5)
    .map((project) => `| [${project.repo}](${project.html_url}) | ${project.language} | ${project.themes[0]} | ${project.lastPushDays} days ago |`)
    .join('\n');

  return [
    '<!-- START: LEARNING_DYNAMIC -->',
    '### Focus areas inferred from current public projects',
    '',
    themeBlocks(projects),
    '',
    '### Technology mix',
    '',
    `- **Languages in active public portfolio:** ${languageSummary(projects)}`,
    `- **Projects tracked:** ${projects.length}`,
    '',
    '### Recently touched public repos',
    '',
    '| Repo | Primary language | Theme | Last public push |',
    '|------|------------------|-------|------------------|',
    newest,
    '<!-- END: LEARNING_DYNAMIC -->',
  ].join('\n');
}

async function updateReadme(block) {
  const readme = await readFile(README_PATH, 'utf8');
  const sectionRegex = /## 🧠 Learning & Interests[\s\S]*?---\n\n## 🌟 GitHub Showcase/;
  const replacement = [
    '## 🧠 Learning & Interests',
    '',
    '<details>',
    '<summary><b>Click to view themes inferred from current public repos</b></summary>',
    '',
    'This section is generated strictly from the current public repository portfolio — not from generic interest statements.',
    '',
    block,
    '',
    '</details>',
    '',
    '---',
    '',
    '## 🌟 GitHub Showcase',
  ].join('\n');

  await writeFile(README_PATH, readme.replace(sectionRegex, replacement), 'utf8');
}

async function main() {
  const projects = await fetchPublicRepoPortfolio();
  await updateReadme(buildLearningBlock(projects));
  console.log(`✓ Learning & interests updated from ${projects.length} public repositories`);
}

main().catch((error) => {
  console.error('Error updating learning section:', error.message);
  process.exit(1);
});
