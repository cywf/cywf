#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fetchPublicRepoPortfolio, STATUS, truncate } from './publicRepoData.mjs';

const HISTORY_PATH = join(process.cwd(), 'data', 'daily-digists.json');
const DIGEST_DIR = join(process.cwd(), 'daily');
const NOW = new Date();
const SINCE = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

function prettyUtc(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`;
}

function headers() {
  return {
    'User-Agent': 'cywf-daily-digist/1.0',
    Accept: 'application/vnd.github+json',
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
}

async function githubJson(url) {
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return response.json();
}

async function loadHistory() {
  try {
    return JSON.parse(await readFile(HISTORY_PATH, 'utf8'));
  } catch {
    return [];
  }
}

async function saveHistory(entries) {
  await mkdir(dirname(HISTORY_PATH), { recursive: true });
  await writeFile(HISTORY_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

function summarizeCommits(commits = []) {
  return commits.slice(0, 3).map((commit) => ({
    sha: commit.sha.slice(0, 7),
    message: truncate(commit.commit?.message?.split('\n')[0] || 'No commit message', 90),
    url: commit.html_url,
    author: commit.commit?.author?.name || commit.author?.login || 'unknown',
  }));
}

function summarizeFailures(runs = []) {
  return runs
    .filter((run) => run.conclusion && run.conclusion !== 'success')
    .slice(0, 3)
    .map((run) => ({
      name: run.name,
      conclusion: run.conclusion,
      url: run.html_url,
    }));
}

function summarizeIssues(issues = []) {
  return issues.slice(0, 3).map((issue) => ({
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    created_at: issue.created_at,
  }));
}

function buildNextSteps(project, repoData) {
  const steps = [];

  if (repoData.openIssues.length > 0) {
    const top = repoData.openIssues[0];
    steps.push(`Resolve blocker issue [#${top.number} ${truncate(top.title, 70)}](${top.url}) and re-run validation.`);
  }

  if (!project.primaryWorkflow) {
    steps.push('Add or restore a substantive public CI workflow so breakages are visible automatically.');
  }

  if (repoData.failures.length > 0) {
    const failure = repoData.failures[0];
    steps.push(`Fix the latest failing workflow run ([${failure.name}](${failure.url}) → ${failure.conclusion}) and confirm it returns green.`);
  }

  if (project.lastPushDays !== null && project.lastPushDays > 180) {
    steps.push('Ship a small public code or docs update to clear the stale-status signal on the default branch.');
  }

  if (project.classification.status === STATUS.SEMI && steps.length < 3) {
    steps.push(`Harden the repo health signal by addressing: ${project.classification.reason}.`);
  }

  const theme = project.themes[0] || 'General Software Projects';
  if (theme === 'Cybersecurity & Defense') {
    steps.push('Document the next security milestone and add a regression check around the highest-risk path.');
  } else if (theme === 'Infrastructure & Networking') {
    steps.push('Validate environment bootstrap or deployment instructions from a clean machine.');
  } else if (theme === 'Web Platforms & Content') {
    steps.push('Test the primary end-user flow and capture any UX/deploy blockers publicly.');
  } else if (theme === 'Developer Tooling & Automation') {
    steps.push('Add a smoke test or runnable example that proves the core workflow end to end.');
  } else if (theme === 'Mapping, Mobility & Aviation') {
    steps.push('Refresh data/API assumptions and verify the map or search workflow still works.');
  } else {
    steps.push('Define the next shippable milestone and capture acceptance criteria in a public issue or README section.');
  }

  steps.push('Review the README/docs so the current status, blockers, and usage path match reality.');

  return Array.from(new Set(steps)).slice(0, 3);
}

async function fetchRepoDigestData(project) {
  const repoBase = `https://api.github.com/repos/${project.owner}/${project.repo}`;
  const since = encodeURIComponent(SINCE.toISOString());

  const [commits, runPayload, issuePayload] = await Promise.all([
    githubJson(`${repoBase}/commits?since=${since}&per_page=10`).catch(() => []),
    githubJson(`${repoBase}/actions/runs?per_page=10`).catch(() => ({ workflow_runs: [] })),
    githubJson(`${repoBase}/issues?state=open&per_page=10`).catch(() => []),
  ]);

  const runs = (runPayload.workflow_runs || []).filter((run) => new Date(run.created_at) >= SINCE);
  const issues = issuePayload.filter((issue) => !issue.pull_request).map((issue) => ({
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    created_at: issue.created_at,
  }));

  return {
    commitCount: commits.length,
    commits: summarizeCommits(commits),
    failures: summarizeFailures(runs),
    openIssues: issues,
    recentIssues: summarizeIssues(issues.filter((issue) => new Date(issue.created_at) >= SINCE)),
  };
}

function digestSummary(projectDigests) {
  return {
    activeRepos: projectDigests.filter(({ repoData }) => repoData.commitCount > 0 || repoData.failures.length > 0 || repoData.recentIssues.length > 0).length,
    totalCommits: projectDigests.reduce((sum, { repoData }) => sum + repoData.commitCount, 0),
    totalFailures: projectDigests.reduce((sum, { repoData }) => sum + repoData.failures.length, 0),
    working: projectDigests.filter(({ project }) => project.classification.status === STATUS.WORKING).length,
    semi: projectDigests.filter(({ project }) => project.classification.status === STATUS.SEMI).length,
    broken: projectDigests.filter(({ project }) => project.classification.status === STATUS.BROKEN).length,
  };
}

function buildDigest(projectDigests) {
  const summary = digestSummary(projectDigests);
  const lines = [
    `# Daily Di-Gist — ${isoDate(NOW)}`,
    '',
    `Window reviewed: ${prettyUtc(SINCE)} → ${prettyUtc(NOW)}`,
    '',
    '## Executive snapshot',
    '',
    `- Public repos reviewed: ${projectDigests.length}`,
    `- Repos with new visible activity in the last 24h: ${summary.activeRepos}`,
    `- Public commits observed in the last 24h: ${summary.totalCommits}`,
    `- Failing workflow runs observed in the last 24h: ${summary.totalFailures}`,
    `- Portfolio health snapshot: ${summary.working} working / ${summary.semi} semi-functioning / ${summary.broken} broken`,
    '',
    '## Repo-by-repo status',
    '',
  ];

  for (const { project, repoData } of projectDigests) {
    lines.push(`### ${project.repo}`);
    lines.push(`- **Health:** ${project.classification.status} — ${project.classification.reason}`);
    lines.push(`- **Progress in last 24h:** ${repoData.commitCount > 0 ? `${repoData.commitCount} public commit(s)` : 'No public commits observed.'}`);

    if (repoData.commits.length > 0) {
      lines.push('- **Recent commits:**');
      for (const commit of repoData.commits) {
        lines.push(`  - [\`${commit.sha}\`](${commit.url}) ${commit.message} — ${commit.author}`);
      }
    }

    if (repoData.recentIssues.length > 0) {
      lines.push('- **New / updated blocker signals:**');
      for (const issue of repoData.recentIssues) {
        lines.push(`  - [#${issue.number} ${truncate(issue.title, 85)}](${issue.url})`);
      }
    } else if (repoData.failures.length > 0) {
      lines.push('- **Things that broke:**');
      for (const failure of repoData.failures) {
        lines.push(`  - [${failure.name}](${failure.url}) concluded as **${failure.conclusion}**`);
      }
    } else {
      lines.push('- **Things that broke:** None surfaced publicly in the last 24h.');
    }

    if (project.blockage && project.blockage !== '—') {
      lines.push(`- **Current blockage link:** ${project.blockage}`);
    }

    lines.push('- **Next 3 moves:**');
    for (const [index, step] of buildNextSteps(project, repoData).entries()) {
      lines.push(`  ${index + 1}. ${step}`);
    }
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function buildHistoryEntry(body, relativePath, projectDigests) {
  const summary = digestSummary(projectDigests);
  return {
    date: isoDate(NOW),
    title: `Daily Di-Gist — ${isoDate(NOW)}`,
    summary: truncate(`Public repos reviewed: ${projectDigests.length}. ${summary.totalCommits} commits observed. ${summary.totalFailures} workflow failures observed.`, 110),
    path: relativePath,
    updated_at: NOW.toISOString(),
  };
}

async function writeDigest(body) {
  const date = isoDate(NOW);
  const relativePath = `daily/${date}.md`;
  const absolutePath = join(process.cwd(), relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${body.trimEnd()}\n`, 'utf8');
  return { relativePath, absolutePath };
}

async function main() {
  const projects = await fetchPublicRepoPortfolio();
  const projectDigests = [];

  for (const project of projects) {
    projectDigests.push({ project, repoData: await fetchRepoDigestData(project) });
  }

  const body = buildDigest(projectDigests);
  const { relativePath } = await writeDigest(body);
  const history = await loadHistory();
  const entry = buildHistoryEntry(body, relativePath, projectDigests);
  const merged = [entry, ...history.filter((item) => item.date !== entry.date)].slice(0, 30);
  await saveHistory(merged);

  console.log(`✓ Daily Di-Gist written to ${relativePath}`);
}

main().catch((error) => {
  console.error('Error creating Daily Di-Gist:', error.message);
  process.exit(1);
});
