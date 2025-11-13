#!/usr/bin/env node

/**
 * Build Repository Mermaid Diagram
 * Generates a Mermaid mindmap of all public repositories
 */

import { Octokit } from '@octokit/rest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'cywf';
const README_PATH = join(process.cwd(), 'README.md');

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Fetch all public repositories
 */
async function fetchRepos() {
  console.log(`Fetching public repositories for user: ${OWNER}`);
  
  try {
    const repos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data } = await octokit.rest.repos.listForUser({
        username: OWNER,
        per_page: 100,
        page,
        type: 'public',
        sort: 'updated',
      });
      
      repos.push(...data);
      hasMore = data.length === 100;
      page++;
    }
    
    console.log(`Fetched ${repos.length} public repositories`);
    return repos;
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    throw error;
  }
}

/**
 * Sanitize text for Mermaid (remove special chars that break syntax)
 */
function sanitize(text) {
  if (!text) return 'No description';
  return text
    .replace(/["\[\](){}]/g, '') // Remove special chars
    .replace(/\n/g, ' ') // Remove newlines
    .substring(0, 60); // Limit length
}

/**
 * Generate Mermaid mindmap
 */
function generateMermaid(repos) {
  console.log('Generating Mermaid mindmap...');
  
  // Sort repos by stars (descending)
  const sorted = repos
    .filter(r => !r.fork) // Exclude forks
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20); // Top 20 repos
  
  let mermaid = 'mindmap\n';
  mermaid += '  root((cywf repos))\n';
  
  for (const repo of sorted) {
    const desc = sanitize(repo.description);
    mermaid += `    ${repo.name}[${desc}]\n`;
  }
  
  return mermaid;
}

/**
 * Update README with Mermaid diagram
 */
async function updateReadme(mermaidCode) {
  console.log('Reading README.md...');
  const readme = await readFile(README_PATH, 'utf8');
  
  const startMarker = '<!-- START: REPO_MERMAID -->';
  const endMarker = '<!-- END: REPO_MERMAID -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find REPO_MERMAID markers in README.md');
    console.error(`Expected markers: '${startMarker}' and '${endMarker}'`);
    console.error('Please ensure these markers exist in README.md before running this script.');
    
    // Exit gracefully for CI
    console.log('Skipping update due to missing markers.');
    process.exit(0);
  }
  
  const newContent = `${startMarker}
<details>
<summary><b>🧭 Repository Map (Mermaid)</b></summary>

\`\`\`mermaid
${mermaidCode}
\`\`\`
</details>
${endMarker}`;
  
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
    const repos = await fetchRepos();
    
    if (repos.length === 0) {
      console.log('No repositories found, skipping update');
      return;
    }
    
    const mermaidCode = generateMermaid(repos);
    await updateReadme(mermaidCode);
    
    console.log('✓ Mermaid diagram update complete!');
  } catch (error) {
    console.error('Error updating Mermaid diagram:', error.message);
    process.exit(1);
  }
}

main();
