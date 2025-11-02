#!/usr/bin/env node

/**
 * Update Learning & Interests
 * Analyzes last 24h of commit activity and infers technologies
 */

import { graphql } from '@octokit/graphql';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'cywf';
const README_PATH = join(process.cwd(), 'README.md');

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const client = graphql.defaults({
  headers: { authorization: `token ${GITHUB_TOKEN}` },
});

/**
 * Technology mapping from file extensions
 */
const TECH_MAP = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.tf': 'Terraform',
  '.yml': 'YAML',
  '.yaml': 'YAML',
  '.json': 'JSON',
  '.md': 'Docs',
  '.sh': 'Shell',
  '.bash': 'Bash',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.html': 'HTML',
  'Dockerfile': 'Docker',
  '.dockerignore': 'Docker',
};

/**
 * Infer technology from file path
 */
function inferTech(filePath) {
  const fileName = filePath.split('/').pop();
  
  // Check exact filename matches
  if (TECH_MAP[fileName]) return TECH_MAP[fileName];
  
  // Check for GitHub Actions
  if (filePath.includes('.github/workflows/')) return 'GitHub Actions';
  
  // Check extensions
  for (const [ext, tech] of Object.entries(TECH_MAP)) {
    if (filePath.endsWith(ext)) return tech;
  }
  
  return null;
}

/**
 * Fetch recent commits (last 24h)
 */
async function fetchRecentCommits() {
  console.log(`Fetching commits from the last 24 hours for user: ${OWNER}`);
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const query = `
    query($login: String!, $since: GitTimestamp!) {
      user(login: $login) {
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes {
            name
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100, since: $since, author: {id: null}) {
                    totalCount
                    nodes {
                      committedDate
                      author {
                        user {
                          login
                        }
                      }
                      additions
                      deletions
                      changedFiles
                      associatedPullRequests(first: 1) {
                        nodes {
                          files(first: 100) {
                            nodes {
                              path
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  
  try {
    const result = await client(query, {
      login: OWNER,
      since: yesterday.toISOString(),
    });
    
    return result.user.repositories.nodes;
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    throw error;
  }
}

/**
 * Analyze repositories for technologies and commit counts
 */
function analyzeRepos(repos) {
  const repoData = [];
  
  for (const repo of repos) {
    if (!repo.defaultBranchRef || !repo.defaultBranchRef.target) continue;
    
    const commits = repo.defaultBranchRef.target.history.nodes || [];
    
    // Filter commits by the owner
    const ownerCommits = commits.filter(
      c => c.author?.user?.login === OWNER
    );
    
    if (ownerCommits.length === 0) continue;
    
    // Collect technologies from changed files
    const techSet = new Set();
    
    for (const commit of ownerCommits) {
      const prs = commit.associatedPullRequests?.nodes || [];
      
      for (const pr of prs) {
        const files = pr.files?.nodes || [];
        
        for (const file of files) {
          const tech = inferTech(file.path);
          if (tech) techSet.add(tech);
        }
      }
    }
    
    // If no files found in PRs, use some default techs based on repo name/common patterns
    if (techSet.size === 0) {
      // Add some common defaults
      techSet.add('Code');
    }
    
    repoData.push({
      repo: repo.name,
      commits: ownerCommits.length,
      technologies: Array.from(techSet).slice(0, 3), // Top 3
    });
  }
  
  // Sort by commit count
  repoData.sort((a, b) => b.commits - a.commits);
  
  return repoData;
}

/**
 * Generate markdown list
 */
function generateMarkdown(repoData) {
  if (repoData.length === 0) {
    return '_No recent activity detected in the last 24 hours._';
  }
  
  const lines = repoData.map(data => {
    const techList = data.technologies.length > 0 
      ? data.technologies.join(', ') 
      : 'Various';
    const commitText = data.commits === 1 ? '1 commit' : `${data.commits} commits`;
    return `- **${data.repo}** — ${techList} (${commitText})`;
  });
  
  return lines.join('\n');
}

/**
 * Update README with learning data
 */
async function updateReadme(markdown) {
  console.log('Reading README.md...');
  const readme = await readFile(README_PATH, 'utf8');
  
  const startMarker = '<!-- START: LEARNING_DYNAMIC -->';
  const endMarker = '<!-- END: LEARNING_DYNAMIC -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find LEARNING_DYNAMIC markers in README.md');
    process.exit(1);
  }
  
  const newContent = `${startMarker}\n${markdown}\n${endMarker}`;
  
  const updatedReadme = readme.substring(0, startIndex) + newContent + readme.substring(endIndex + endMarker.length);
  
  console.log('Writing updated README.md...');
  await writeFile(README_PATH, updatedReadme, 'utf8');
  console.log('✓ README.md updated successfully!');
}

/**
 * Main execution
 */
async function main() {
  try {
    const repos = await fetchRecentCommits();
    const repoData = analyzeRepos(repos);
    
    console.log(`Found activity in ${repoData.length} repositories`);
    
    const markdown = generateMarkdown(repoData);
    await updateReadme(markdown);
    
    console.log('✓ Learning & Interests update complete!');
  } catch (error) {
    console.error('Error updating learning section:', error.message);
    process.exit(1);
  }
}

main();
