#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchPublicRepoPortfolio, portfolioTimestamp, summarizePortfolio, STATUS } from './publicRepoData.mjs';
import { fetchAllBoardTasks } from './fetchProjectBoardTasks.mjs';

const README_PATH = join(process.cwd(), 'README.md');

function graphNode(project) {
  const icon = project.classification.status === STATUS.WORKING ? '🟢' : project.classification.status === STATUS.SEMI ? '🟡' : '🔴';
  return `${project.repo}[${icon} ${project.repo}]`;
}

function buildGraph(projects) {
  const groups = {
    'Cybersecurity & Defense': [],
    'Infrastructure & Networking': [],
    'Mapping, Mobility & Aviation': [],
    'Web Platforms & Content': [],
    'Developer Tooling & Automation': [],
    'General Software Projects': [],
  };

  for (const project of projects) {
    const group = project.themes[0] || 'General Software Projects';
    (groups[group] ||= []).push(project);
  }

  const lines = ['flowchart LR', '  root((cywf public repo ecosystem))'];
  for (const [groupName, repos] of Object.entries(groups)) {
    if (repos.length === 0) continue;
    const groupId = groupName.replace(/[^A-Za-z0-9]/g, '');
    lines.push(`  root --> ${groupId}[${groupName}]`);
    for (const project of repos) {
      lines.push(`  ${groupId} --> ${graphNode(project)}`);
    }
  }
  return lines.join('\n');
}

function buildOverviewBlock(projects, boardTasks) {
  const { counts, languages, themes } = summarizePortfolio(projects);
  const timestamp = portfolioTimestamp();
  const queuedBoardTasks = [...boardTasks.values()].reduce((sum, tasks) => sum + tasks.length, 0);
  const liveProjects = projects.filter((project) => project.dataSource === 'live').length;
  const fallbackProjects = projects.length - liveProjects;
  const taskMode = boardTasks.degradedReason || 'Live Projects v2 data when PROJECTS_TOKEN is available; local runs without it show an explicit degraded state.';

  const staleProjects = [...projects]
    .filter((project) => project.lastPushDays !== null)
    .sort((a, b) => (b.lastPushDays || 0) - (a.lastPushDays || 0))
    .slice(0, 3)
    .map((project) => `- **${project.repo}** — last push ${project.lastPushDays} days ago`)
    .join('\n');

  return [
    '<!-- START: SYSTEM_OVERVIEW -->',
    '| Metric | Status |',
    '|--------|--------|',
    `| Public repos tracked | ${counts.totalRepos} |`,
    `| Working repos | ${counts.working} |`,
    `| Semi-functioning repos | ${counts.semi} |`,
    `| Broken repos | ${counts.broken} |`,
    `| Repos with substantive public CI | ${counts.activeWorkflowRepos} |`,
    `| Open blocker issues | ${counts.totalIssues} |`,
    `| Queued board tasks | ${queuedBoardTasks} |`,
    `| Data freshness mode | ${liveProjects}/${projects.length} live GitHub reads; ${fallbackProjects} snapshot/seed fallbacks |`,
    `| Next-Tasks source | ${taskMode} |`,
    `| Primary language mix | ${languages.join(', ')} |`,
    `| Portfolio themes | ${themes.join(' • ')} |`,
    `| Last ecosystem refresh | ${timestamp} |`,
    '<!-- END: SYSTEM_OVERVIEW -->',
    '',
    '<!-- START: REPO_MERMAID -->',
    '<details>',
    '<summary><b>🗺️ Public Repo Ecosystem Graph</b></summary>',
    '',
    '```mermaid',
    buildGraph(projects),
    '```',
    '',
    '### Attention queue',
    staleProjects || '- No stale public repositories detected.',
    '',
    '</details>',
    '<!-- END: REPO_MERMAID -->',
  ].join('\n');
}

async function updateReadme(block) {
  const readme = await readFile(README_PATH, 'utf8');
  const sectionRegex = /<details>\n<summary><b>📊 System Overview<\/b><\/summary>[\s\S]*?<\/details>\n\n---/;
  const replacement = [
    '<details>',
    '<summary><b>📊 System Overview</b></summary>',
    '',
    'A public-repo-only snapshot of the cywf ecosystem: what is active, what needs attention, and how the projects cluster together.',
    '',
    block,
    '',
    '</details>',
    '',
    '---',
  ].join('\n');

  await writeFile(README_PATH, readme.replace(sectionRegex, replacement), 'utf8');
}

async function main() {
  const projects = await fetchPublicRepoPortfolio();
  const boardTasks = await fetchAllBoardTasks(projects);
  await updateReadme(buildOverviewBlock(projects, boardTasks));
  console.log(`✓ System overview updated for ${projects.length} public repositories`);
}

main().catch((error) => {
  console.error('Error updating system overview:', error.message);
  process.exit(1);
});
