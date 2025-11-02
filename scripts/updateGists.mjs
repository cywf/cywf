#!/usr/bin/env node

/**
 * Update Latest Blog Posts (Gists)
 * Fetches 5 rotating gists that are different from yesterday
 */

import { Octokit } from '@octokit/rest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'cywf';
const README_PATH = join(process.cwd(), 'README.md');
const HISTORY_PATH = join(process.cwd(), 'data', 'gists-history.json');
const GISTS_TO_DISPLAY = 5;

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Truncate text to max length
 */
function truncate(text, maxLength = 80) {
  if (!text) return 'No description available';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Load gist history
 */
async function loadHistory() {
  try {
    const content = await readFile(HISTORY_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Could not load history, starting fresh');
    return { lastUpdate: null, previousGistIds: [] };
  }
}

/**
 * Save gist history
 */
async function saveHistory(history) {
  await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
}

/**
 * Fetch all public gists
 */
async function fetchGists() {
  console.log(`Fetching gists for user: ${OWNER}`);
  
  try {
    const { data } = await octokit.rest.gists.listForUser({
      username: OWNER,
      per_page: 100,
    });
    
    console.log(`Fetched ${data.length} gists`);
    return data;
  } catch (error) {
    console.error('Error fetching gists:', error.message);
    throw error;
  }
}

/**
 * Select gists different from yesterday
 */
function selectGists(gists, previousIds) {
  // Separate gists into used and unused
  const unused = gists.filter(g => !previousIds.includes(g.id));
  const used = gists.filter(g => previousIds.includes(g.id));
  
  // Prioritize unused gists
  let selected = [...unused];
  
  // If we need more, add from used pool
  if (selected.length < GISTS_TO_DISPLAY) {
    selected = [...selected, ...used];
  }
  
  // Shuffle and take what we need
  selected.sort(() => Math.random() - 0.5);
  selected = selected.slice(0, GISTS_TO_DISPLAY);
  
  // Sort by update date (newest first)
  selected.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  console.log(`Selected ${selected.length} gists (${unused.length} new, ${used.length} previously shown)`);
  
  return selected;
}

/**
 * Generate markdown table with Read more buttons
 */
function generateGistTable(gists) {
  const rows = gists.map(gist => {
    const date = formatDate(gist.updated_at);
    const files = Object.keys(gist.files);
    const filename = files[0] || 'Untitled';
    const title = gist.description || filename;
    const summary = truncate(gist.description || 'No description available', 60);
    const url = gist.html_url;
    const button = `<a href="${url}"><img alt="Read more" src="https://img.shields.io/badge/Read%20more-1f6feb?style=for-the-badge"></a>`;
    
    return `| ${date} | ${title} | ${summary} | ${button} |`;
  });
  
  return rows.join('\n');
}

/**
 * Update README with new gists
 */
async function updateReadme(gistTable) {
  console.log('Reading README.md...');
  const readme = await readFile(README_PATH, 'utf8');
  
  const startMarker = '<!-- START: LATEST_POSTS -->';
  const endMarker = '<!-- END: LATEST_POSTS -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find LATEST_POSTS markers in README.md');
    process.exit(1);
  }
  
  const tableHeader = `| Date | Title | Summary | Source |\n|------|-------|---------|--------|`;
  const newContent = `${startMarker}\n${tableHeader}\n${gistTable}\n${endMarker}`;
  
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
    // Load history
    const history = await loadHistory();
    
    // Fetch gists
    const gists = await fetchGists();
    
    if (gists.length === 0) {
      console.log('No gists found, skipping update');
      return;
    }
    
    // Select gists different from yesterday
    const selected = selectGists(gists, history.previousGistIds);
    
    // Generate table
    const gistTable = generateGistTable(selected);
    
    // Update README
    await updateReadme(gistTable);
    
    // Save history
    await saveHistory({
      lastUpdate: new Date().toISOString(),
      previousGistIds: selected.map(g => g.id),
    });
    
    console.log('✓ Gists update complete!');
  } catch (error) {
    console.error('Error updating gists:', error.message);
    process.exit(1);
  }
}

main();
