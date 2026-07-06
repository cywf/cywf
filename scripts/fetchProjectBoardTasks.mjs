#!/usr/bin/env node

/**
 * Fetches Projects v2 board tasks for each tracked public repo.
 *
 * Uses PROJECTS_TOKEN (classic PAT with project+repo scopes). Falls back to
 * GITHUB_TOKEN if PROJECTS_TOKEN is not set, and returns empty results
 * gracefully if neither token grants Projects access.
 */

const PROJECTS_TOKEN = process.env.PROJECTS_TOKEN || process.env.GITHUB_TOKEN || '';

const TODO_RE = /^(todo|to do|ready|backlog|next)$/i;
const IN_PROGRESS_RE = /^in progress$/i;

function isQueuedStatus(name) {
  return TODO_RE.test(name) || IN_PROGRESS_RE.test(name);
}

function statusRank(name) {
  return IN_PROGRESS_RE.test(name) ? 2 : 1;
}

function priorityRank(name) {
  if (!name) return 0;
  if (/^(urgent|critical|p0)$/i.test(name)) return 4;
  if (/^(high|p1)$/i.test(name)) return 3;
  if (/^(medium|normal|p2)$/i.test(name)) return 2;
  if (/^(low|p3)$/i.test(name)) return 1;
  return 0;
}

async function graphqlRequest(query, variables = {}) {
  if (!PROJECTS_TOKEN) return null;

  let response;
  try {
    response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'cywf-profile-bot/1.0',
        Authorization: `Bearer ${PROJECTS_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const json = await response.json();
  if (json.errors?.length) return null;

  return json.data;
}

const ITEMS_FIELDS = `
  items(first: 100) {
    nodes {
      id
      fullDatabaseId
      isArchived
      createdAt
      content {
        __typename
        ... on Issue {
          title
          url
        }
        ... on PullRequest {
          title
          url
        }
        ... on DraftIssue {
          title
        }
      }
      fieldValues(first: 20) {
        nodes {
          __typename
          ... on ProjectV2ItemFieldSingleSelectValue {
            name
            field {
              ... on ProjectV2SingleSelectField {
                name
              }
            }
          }
        }
      }
    }
  }
`;

function extractSingleSelectField(item, fieldName) {
  const re = new RegExp(`^${fieldName}$`, 'i');
  for (const fv of item.fieldValues?.nodes ?? []) {
    if (fv.__typename === 'ProjectV2ItemFieldSingleSelectValue' && re.test(fv.field?.name)) {
      return fv.name ?? null;
    }
  }
  return null;
}

function processItems(board, rawItems) {
  const queued = rawItems
    .filter((item) => !item.isArchived)
    .reduce((acc, item) => {
      const status = extractSingleSelectField(item, 'Status');
      if (!status || !isQueuedStatus(status)) return acc;

      const priority = extractSingleSelectField(item, 'Priority');
      const isDraft = item.content?.__typename === 'DraftIssue';
      const title = item.content?.title ?? '(untitled)';
      const contentUrl = item.content?.url ?? null;
      const itemUrl = isDraft
        ? board.url
        : `${board.url}?pane=issue&itemId=${item.fullDatabaseId}`;

      acc.push({
        title,
        status,
        priority,
        itemUrl,
        contentUrl,
        createdAt: item.createdAt,
        _statusRank: statusRank(status),
        _priorityRank: priorityRank(priority),
      });
      return acc;
    }, []);

  queued.sort((a, b) => {
    if (b._statusRank !== a._statusRank) return b._statusRank - a._statusRank;
    if (b._priorityRank !== a._priorityRank) return b._priorityRank - a._priorityRank;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return queued.slice(0, 3);
}

async function fetchRepoBoards(owner, repo) {
  const query = `
    query RepoProjects($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 5) {
          nodes {
            id
            title
            url
            ${ITEMS_FIELDS}
          }
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { owner, repo });
  return data?.repository?.projectsV2?.nodes ?? [];
}

async function fetchViewerBoards() {
  const query = `
    query ViewerProjects {
      viewer {
        projectsV2(first: 20) {
          nodes {
            id
            title
            url
            ${ITEMS_FIELDS}
          }
        }
      }
    }
  `;

  const data = await graphqlRequest(query);
  return data?.viewer?.projectsV2?.nodes ?? [];
}

/**
 * Fetches Projects v2 board tasks for each project in the portfolio.
 *
 * @param {Array<{owner: string, repo: string}>} projects
 * @returns {Promise<Map<string, Array>>} Map from "owner/repo" (lower-case) → top-3 task items
 */
export async function fetchAllBoardTasks(projects) {
  if (!PROJECTS_TOKEN) {
    return new Map();
  }

  let viewerBoards = null;
  const result = new Map();

  for (const project of projects) {
    const key = `${project.owner}/${project.repo}`.toLowerCase();

    try {
      const repoBoards = await fetchRepoBoards(project.owner, project.repo);
      let board = repoBoards[0] ?? null;

      if (!board) {
        if (!viewerBoards) {
          viewerBoards = await fetchViewerBoards();
        }
        board =
          viewerBoards.find((b) => b.title.toLowerCase() === project.repo.toLowerCase()) ?? null;
      }

      result.set(key, board ? processItems(board, board.items?.nodes ?? []) : []);
    } catch {
      result.set(key, []);
    }
  }

  return result;
}
