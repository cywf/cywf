#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchPublicRepoPortfolio, STATUS, truncate } from './publicRepoData.mjs';
import { fetchAllBoardTasks } from './fetchProjectBoardTasks.mjs';

const README_PATH = join(process.cwd(), 'README.md');

function blockageCell(project) {
  const issue = project.open_issues[0];
  if (!issue) return 'None';
  return `[Issue #${issue.number}](${issue.html_url})`;
}

function nextTasksCell(tasks, boardTasks) {
  if (boardTasks.degradedReason) return `⚠ ${boardTasks.degradedReason}`;
  if (!tasks || tasks.length === 0) return 'No queued Project task found';
  return tasks.map((t) => `\`${t.status}\` [${t.title}](${t.itemUrl})`).join('<br>');
}

function signalText(project) {
  const push = project.lastPushDays === null ? 'unknown' : `${project.lastPushDays}d since push`;
  const workflow = project.primaryWorkflow?.name || 'No public CI';
  return `${workflow} • ${push}`;
}

function row(project) {
  return `| **[${project.repo}](${project.html_url})** | ${truncate(project.description, 78)} | ${project.workflowBadge} | ${project.classification.reason} | ${blockageCell(project)} |`;
}

function detailBlock(title, projects, boardTasks) {
  const table = projects.length
    ? [
        '| Project | What it does | Workflow | Status signal | Blockage | Next tasks |',
        '|---------|---------------|----------|---------------|----------|------------|',
        ...projects.map((project) => {
          const key = `${project.owner}/${project.repo}`.toLowerCase();
          return `| **[${project.repo}](${project.html_url})** | ${truncate(project.description, 70)} | ${project.workflowBadge} | ${signalText(project)} | ${blockageCell(project)} | ${nextTasksCell(boardTasks.get(key), boardTasks)} |`;
        }),
      ].join('\n')
    : '_None in this category right now._';

  return [
    `<details>`,
    `<summary><b>${title} (${projects.length})</b></summary>`,
    '',
    table,
    '',
    '</details>',
  ].join('\n');
}

function buildMatrix(projects, boardTasks) {
  const working = projects.filter((project) => project.classification.status === STATUS.WORKING);
  const semi = projects.filter((project) => project.classification.status === STATUS.SEMI);
  const broken = projects.filter((project) => project.classification.status === STATUS.BROKEN);

  const summary = [
    '<!-- START: PROJECT_MATRIX -->',
    '| Status | Count | Meaning |',
    '|--------|-------|---------|',
    `| Working | ${working.length} | Public CI present and no obvious portfolio-level blocker signal |`,
    `| Semi-functioning | ${semi.length} | Stale pushes, missing substantive CI, or disabled workflow signals |`,
    `| Broken | ${broken.length} | Archived repo or open blocker issue combined with disabled workflow |`,
    '<!-- END: PROJECT_MATRIX -->',
  ].join('\n');

  return [
    summary,
    '',
    detailBlock('🟢 Working repositories', working, boardTasks),
    '',
    detailBlock('🟡 Semi-functioning repositories', semi, boardTasks),
    '',
    detailBlock('🔴 Broken repositories', broken, boardTasks),
  ].join('\n');
}

async function updateReadme(matrixBlock) {
  const readme = await readFile(README_PATH, 'utf8');
  const sectionRegex = /## 🚀 Project M3trix[\s\S]*?---\n\n## 📊 Developer Analytics/;
  const replacement = [
    '## 🚀 Project M3trix',
    '',
    '<details>',
    '<summary><b>Click to view public repo health by status category</b></summary>',
    '',
    'This matrix groups public repositories into working, semi-functioning, and broken buckets based on public workflow visibility, open issue blockages, and recent push activity.',
    '',
    '_Next-Tasks cells are rendered from GitHub Projects v2 when `PROJECTS_TOKEN` is available. Local or unauthenticated runs explicitly mark those cells as degraded instead of pretending there are no tasks._',
    '',
    matrixBlock,
    '',
    '</details>',
    '',
    '---',
    '',
    '## 📊 Developer Analytics',
  ].join('\n');

  await writeFile(README_PATH, readme.replace(sectionRegex, replacement), 'utf8');
}

async function main() {
  const projects = await fetchPublicRepoPortfolio();
  const boardTasks = await fetchAllBoardTasks(projects);
  await updateReadme(buildMatrix(projects, boardTasks));
  console.log(`✓ Project matrix updated for ${projects.length} public repositories`);
}

main().catch((error) => {
  console.error('Error updating project matrix:', error.message);
  process.exit(1);
});
