#!/usr/bin/env node

/**
 * Update Project Matrix
 * Builds a public-repo project table with real workflow badges.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');
const PROJECTS_PATH = join(process.cwd(), 'config', 'projects.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

async function githubJson(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      'User-Agent': 'cywf-profile-bot/1.0',
      Accept: 'application/vnd.github+json',
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }

  return response.json();
}

async function loadProjects() {
  return JSON.parse(await readFile(PROJECTS_PATH, 'utf8'));
}

function workflowRank(workflow) {
  const text = `${workflow.name || ''} ${workflow.path || ''}`.toLowerCase();
  if (text.includes('test')) return 100;
  if (text.includes('ci')) return 90;
  if (text.includes('build')) return 80;
  if (text.includes('validate')) return 70;
  if (text.includes('security')) return 60;
  if (text.includes('deploy')) return 50;
  if (text.includes('pages-build-deployment')) return -10;
  if (text.includes('copilot')) return -20;
  return 10;
}

function selectWorkflow(workflows = []) {
  const filtered = workflows.filter((workflow) => {
    const file = (workflow.path || '').split('/').pop();
    return file && file !== 'copilot' && file !== 'pages-build-deployment';
  });

  if (filtered.length === 0) return null;
  return [...filtered].sort((a, b) => workflowRank(b) - workflowRank(a))[0];
}

async function getRepoMetadata(owner, repo) {
  try {
    const [repoData, workflowData] = await Promise.all([
      githubJson(`/repos/${owner}/${repo}`),
      githubJson(`/repos/${owner}/${repo}/actions/workflows`).catch(() => ({ workflows: [] })),
    ]);

    return {
      defaultBranch: repoData.default_branch || 'main',
      htmlUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
      workflow: selectWorkflow(workflowData.workflows || []),
    };
  } catch {
    return {
      defaultBranch: 'main',
      htmlUrl: `https://github.com/${owner}/${repo}`,
      workflow: null,
    };
  }
}

function workflowBadge(owner, repo, branch, workflow) {
  if (!workflow?.path) return '—';
  const file = workflow.path.split('/').pop();
  return `![Workflow](https://github.com/${owner}/${repo}/actions/workflows/${file}/badge.svg?branch=${branch})`;
}

async function generateTable(projects) {
  const rows = [];

  for (const project of projects) {
    const metadata = await getRepoMetadata(project.owner, project.repo);
    rows.push(
      `| **[${project.repo}](${metadata.htmlUrl})** | ${project.desc} | ${workflowBadge(project.owner, project.repo, metadata.defaultBranch, metadata.workflow)} | [Open repo](${metadata.htmlUrl}) |`
    );
  }

  return rows.join('\n');
}

async function updateReadme(matrixTable) {
  const readme = await readFile(README_PATH, 'utf8');
  const startMarker = '<!-- START: PROJECT_MATRIX -->';
  const endMarker = '<!-- END: PROJECT_MATRIX -->';
  const tableBlock = [
    startMarker,
    '| Project | Description | Workflow | Link |',
    '|---------|-------------|----------|------|',
    matrixTable,
    endMarker,
  ].join('\n');

  let updated = readme;
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    updated = `${readme.slice(0, startIndex)}${tableBlock}${readme.slice(endIndex + endMarker.length)}`;
  } else {
    const sectionRegex = /## 🚀 Project M3trix[\s\S]*?<\/details>\n\n---/;
    const replacement = [
      '## 🚀 Project M3trix',
      '',
      '<details>',
      '<summary><b> Click or Tap to view Project Analytics & Status</b></summary>',
      '',
      'The matrix below is generated from the tracked public repositories and their primary public workflow badges.',
      '',
      tableBlock,
      '',
      '_This section updates nightly via automation._',
      '',
      '</details>',
      '',
      '---',
    ].join('\n');

    updated = readme.replace(sectionRegex, replacement);
  }

  await writeFile(README_PATH, updated, 'utf8');
}

async function main() {
  const projects = await loadProjects();
  const table = await generateTable(projects);
  await updateReadme(table);
  console.log(`✓ Project matrix updated for ${projects.length} repositories`);
}

main().catch((error) => {
  console.error('Error updating project matrix:', error.message);
  process.exit(1);
});
