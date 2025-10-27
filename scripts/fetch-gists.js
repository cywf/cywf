#!/usr/bin/env node

/**
 * Fetch Latest Gists Script
 * Fetches the 20 most recent public gists from the cywf GitHub account
 * and updates the README.md file with the results.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_API_URL = 'api.github.com';
const USERNAME = 'cywf';
const README_PATH = path.join(__dirname, '..', 'README.md');
const GISTS_PER_PAGE = 20;

/**
 * Make an HTTPS GET request to GitHub API
 */
function githubApiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GITHUB_API_URL,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'cywf-readme-bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    // Add authorization if token is available
    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Format a date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Truncate text to a maximum length
 */
function truncate(text, maxLength = 100) {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Fetch gists from GitHub API
 */
async function fetchGists() {
  console.log(`Fetching gists for user: ${USERNAME}`);
  
  try {
    const gists = await githubApiRequest(`/users/${USERNAME}/gists?per_page=${GISTS_PER_PAGE}`);
    console.log(`Fetched ${gists.length} gists`);
    return gists;
  } catch (error) {
    console.error('Error fetching gists:', error.message);
    throw error;
  }
}

/**
 * Generate markdown table rows from gists
 */
function generateGistTable(gists) {
  const rows = gists.slice(0, GISTS_PER_PAGE).map(gist => {
    const date = formatDate(gist.updated_at);
    const files = Object.keys(gist.files);
    const filename = files[0] || 'Untitled';
    const title = gist.description || filename;
    const summary = truncate(gist.description || 'No description available', 80);
    const url = gist.html_url;
    
    return `| ${date} | ${title} | ${summary} | [View Gist](${url}) |`;
  });

  return rows.join('\n');
}

/**
 * Update README.md with new gists
 */
function updateReadme(gistTableContent) {
  console.log('Reading README.md...');
  const readme = fs.readFileSync(README_PATH, 'utf8');
  
  const startMarker = '<!-- GISTS_START -->';
  const endMarker = '<!-- GISTS_END -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find gist markers in README.md');
    process.exit(1);
  }
  
  const tableHeader = `| Date | Title | Summary | Source |\n|------|-------|---------|--------|`;
  const newContent = `${startMarker}\n${tableHeader}\n${gistTableContent}\n${endMarker}`;
  
  const updatedReadme = readme.substring(0, startIndex) + newContent + readme.substring(endIndex + endMarker.length);
  
  console.log('Writing updated README.md...');
  fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
  console.log('README.md updated successfully!');
}

/**
 * Main execution
 */
async function main() {
  try {
    const gists = await fetchGists();
    
    if (gists.length === 0) {
      console.log('No gists found, skipping update');
      return;
    }
    
    const gistTable = generateGistTable(gists);
    updateReadme(gistTable);
    
  } catch (error) {
    console.error('Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
