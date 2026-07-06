#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { fetchWithTimeout } from './lib/fetchJson.mjs';
import { join } from 'node:path';

const PROJECTS_PATH = join(process.cwd(), 'config', 'projects.json');
const SNAPSHOT_PATH = join(process.cwd(), 'config', 'public-repo-portfolio.snapshot.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const NOW = new Date();
const API_TIMEOUT_MS = Number(process.env.CYWF_API_TIMEOUT_MS || 10000);

const STATUS = {
  WORKING: 'Working',
  SEMI: 'Semi-functioning',
  BROKEN: 'Broken',
};

function daysSince(dateText) {
  if (!dateText) return null;
  const diff = NOW.getTime() - new Date(dateText).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function truncate(text, max = 120) {
  if (!text) return '—';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function repoApiPath(owner, repo, suffix = '') {
  return `https://api.github.com/repos/${owner}/${repo}${suffix}`;
}

async function githubJson(url) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        'User-Agent': 'cywf-profile-bot/1.0',
        Accept: 'application/vnd.github+json',
        ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      },
    },
    API_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`);
  }

  return response.json();
}

function isSubstantiveWorkflow(workflow = {}) {
  const file = (workflow.path || '').split('/').pop() || '';
  if (!file || file === 'copilot' || file === 'pages-build-deployment') return false;
  return true;
}

function pickPrimaryWorkflow(workflows = []) {
  const ranked = workflows
    .filter(isSubstantiveWorkflow)
    .sort((a, b) => workflowRank(b) - workflowRank(a));
  return ranked[0] || null;
}

function workflowRank(workflow) {
  const text = `${workflow.name || ''} ${workflow.path || ''}`.toLowerCase();
  if (text.includes('test')) return 100;
  if (text.includes('ci')) return 90;
  if (text.includes('build')) return 80;
  if (text.includes('validate')) return 70;
  if (text.includes('security')) return 60;
  if (text.includes('deploy')) return 50;
  return 10;
}

function workflowBadge(owner, repo, branch, workflow) {
  if (!workflow?.path) return '—';
  const file = workflow.path.split('/').pop();
  return `![Workflow](https://github.com/${owner}/${repo}/actions/workflows/${file}/badge.svg?branch=${branch})`;
}

function inferThemes(project) {
  const haystack =
    `${project.repo} ${project.description || ''} ${(project.topics || []).join(' ')}`.toLowerCase();
  const themes = [];
  if (/(security|threat|defense|ctf|tactical|tak|risk|osint|cyber)/.test(haystack))
    themes.push('Cybersecurity & Defense');
  if (/(network|infrastructure|server|terraform|zerotier|linux)/.test(haystack))
    themes.push('Infrastructure & Networking');
  if (/(map|airport|gis|aviation|atlas|flight)/.test(haystack))
    themes.push('Mapping, Mobility & Aviation');
  if (/(web|blog|portfolio|pages|real estate|frontend|site)/.test(haystack))
    themes.push('Web Platforms & Content');
  if (/(template|boilerplate|toolkit|automation)/.test(haystack))
    themes.push('Developer Tooling & Automation');
  if (themes.length === 0) themes.push('General Software Projects');
  return Array.from(new Set(themes));
}

function classifyProject(project) {
  const staleDays = daysSince(project.pushed_at);
  const substantiveWorkflows = (project.workflows || []).filter(isSubstantiveWorkflow);
  const disabledWorkflows = substantiveWorkflows.filter((workflow) => workflow.state !== 'active');
  const hasIssues = (project.open_issues || []).length > 0;

  if (project.archived) {
    return {
      status: STATUS.BROKEN,
      reason: 'Archived repository',
      blockage: project.open_issues[0]?.html_url || '—',
    };
  }

  if (hasIssues && disabledWorkflows.length > 0) {
    return {
      status: STATUS.BROKEN,
      reason: `Open blocker issue + ${disabledWorkflows.length} disabled workflow${disabledWorkflows.length === 1 ? '' : 's'}`,
      blockage: project.open_issues[0]?.html_url || '—',
    };
  }

  if (substantiveWorkflows.length === 0) {
    return {
      status: STATUS.SEMI,
      reason: 'No substantive public CI workflow detected',
      blockage: project.open_issues[0]?.html_url || '—',
    };
  }

  if (disabledWorkflows.length > 0) {
    return {
      status: STATUS.SEMI,
      reason: `${disabledWorkflows.length} workflow${disabledWorkflows.length === 1 ? '' : 's'} disabled or inactive`,
      blockage: project.open_issues[0]?.html_url || '—',
    };
  }

  if (staleDays !== null && staleDays > 180) {
    return {
      status: STATUS.SEMI,
      reason: `No public code push in ${staleDays} days`,
      blockage: project.open_issues[0]?.html_url || '—',
    };
  }

  return {
    status: STATUS.WORKING,
    reason: `Primary workflow active; last push ${staleDays ?? 'unknown'} days ago`,
    blockage: project.open_issues[0]?.html_url || '—',
  };
}

export async function loadProjectSeeds() {
  return JSON.parse(await readFile(PROJECTS_PATH, 'utf8'));
}

async function loadSnapshot() {
  try {
    return JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return [];
  }
}

export async function fetchPublicRepoPortfolio() {
  const seeds = await loadProjectSeeds();
  const snapshot = await loadSnapshot();
  const snapshotMap = new Map(
    snapshot.map((project) => [`${project.owner}/${project.repo}`.toLowerCase(), project])
  );
  const results = [];

  for (const seed of seeds) {
    const fallback = snapshotMap.get(`${seed.owner}/${seed.repo}`.toLowerCase());
    let repoData;
    let workflows = [];
    let issues = [];

    try {
      if (!GITHUB_TOKEN && fallback) {
        throw new Error('GITHUB_TOKEN unavailable; using checked-in snapshot for local run');
      }
      repoData = await githubJson(repoApiPath(seed.owner, seed.repo));

      try {
        const workflowData = await githubJson(
          repoApiPath(seed.owner, seed.repo, '/actions/workflows')
        );
        workflows = workflowData.workflows || [];
      } catch {
        workflows = [];
      }

      try {
        const issueData = await githubJson(
          repoApiPath(seed.owner, seed.repo, '/issues?state=open&per_page=10')
        );
        issues = issueData
          .filter((issue) => !issue.pull_request)
          .map((issue) => ({
            number: issue.number,
            title: issue.title,
            html_url: issue.html_url,
          }));
      } catch {
        issues = [];
      }
    } catch (error) {
      repoData = fallback || {
        html_url: `https://github.com/${seed.owner}/${seed.repo}`,
        description: seed.desc,
        language: 'Unknown',
        topics: [],
        default_branch: 'main',
        archived: false,
        pushed_at: null,
        updated_at: null,
      };
      workflows = fallback?.workflows || [];
      issues = fallback?.open_issues || [];
      repoData._data_source = fallback ? 'snapshot' : 'seed';
      repoData._fetch_error = error.message;
    }

    const project = {
      owner: seed.owner,
      repo: seed.repo,
      configuredDescription: seed.desc,
      description: repoData.description || seed.desc,
      html_url: repoData.html_url || `https://github.com/${seed.owner}/${seed.repo}`,
      language: repoData.language || 'Unknown',
      topics: repoData.topics || [],
      open_issues: issues,
      open_issues_count: issues.length,
      default_branch: repoData.default_branch || 'main',
      archived: Boolean(repoData.archived),
      pushed_at: repoData.pushed_at,
      updated_at: repoData.updated_at,
      workflows,
      dataSource: repoData._data_source || 'live',
      fetchError: repoData._fetch_error || null,
    };

    project.primaryWorkflow = pickPrimaryWorkflow(workflows);
    project.workflowBadge = workflowBadge(
      project.owner,
      project.repo,
      project.default_branch,
      project.primaryWorkflow
    );
    project.themes = inferThemes(project);
    project.classification = classifyProject(project);
    project.lastPushDays = daysSince(project.pushed_at);
    project.blockage = project.classification.blockage;
    results.push(project);
  }

  return results;
}

export function summarizePortfolio(projects) {
  const counts = {
    totalRepos: projects.length,
    working: projects.filter((project) => project.classification.status === STATUS.WORKING).length,
    semi: projects.filter((project) => project.classification.status === STATUS.SEMI).length,
    broken: projects.filter((project) => project.classification.status === STATUS.BROKEN).length,
    totalIssues: projects.reduce((sum, project) => sum + project.open_issues_count, 0),
    activeWorkflowRepos: projects.filter((project) => project.primaryWorkflow).length,
  };

  const languages = [
    ...new Set(projects.map((project) => project.language).filter(Boolean)),
  ].sort();
  const themes = [...new Set(projects.flatMap((project) => project.themes))].sort();

  return { counts, languages, themes };
}

export function portfolioTimestamp() {
  return `${NOW.getUTCFullYear()}-${String(NOW.getUTCMonth() + 1).padStart(2, '0')}-${String(NOW.getUTCDate()).padStart(2, '0')} ${String(NOW.getUTCHours()).padStart(2, '0')}:${String(NOW.getUTCMinutes()).padStart(2, '0')} UTC`;
}

export { STATUS, truncate };
