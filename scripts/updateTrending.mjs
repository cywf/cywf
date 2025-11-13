#!/usr/bin/env node

/**
 * Update GitHub Showcase
 * Fetches top 3 trending repositories for today
 */

import fetch from 'node-fetch';
import { load } from 'cheerio';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');

/**
 * Fetch trending repositories from GitHub
 */
async function fetchTrending() {
  console.log('Fetching trending repositories from GitHub...');
  
  try {
    const url = 'https://github.com/trending?since=daily';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; cywf-bot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    const repos = [];
    
    // GitHub's trending page structure
    $('article.Box-row').each((_, element) => {
      if (repos.length >= 3) return false; // Stop after 3
      
      const $el = $(element);
      
      // Extract repo link
      const link = $el.find('h2 a').attr('href');
      if (!link) return;
      
      const [, owner, name] = link.split('/');
      
      // Extract description
      const description = $el.find('p.col-9').text().trim() || 'No description available';
      
      // Extract language
      const language = $el.find('[itemprop="programmingLanguage"]').text().trim() || 'Unknown';
      
      // Extract stars today
      const starsToday = $el.find('span.d-inline-block.float-sm-right').text().trim() || '0 stars today';
      
      repos.push({
        owner,
        name,
        url: `https://github.com${link}`,
        description: description.substring(0, 150),
        language,
        starsToday,
      });
    });
    
    console.log(`Fetched ${repos.length} trending repositories`);
    return repos;
  } catch (error) {
    console.error('Error fetching trending repos:', error.message);
    
    // Return fallback data if scraping fails
    console.log('Using fallback data...');
    return [
      {
        owner: 'trending',
        name: 'example-repo-1',
        url: 'https://github.com/trending',
        description: 'Trending repositories are currently unavailable. Check back later!',
        language: 'N/A',
        starsToday: '0 stars today',
      },
    ];
  }
}

/**
 * Generate showcase cards for trending repos
 */
function generateShowcase(repos) {
  if (repos.length === 0) {
    return '_Trending repositories are currently unavailable._';
  }
  
  const cards = repos.map((repo, index) => {
    const profileUrl = `https://github.com/${repo.owner}`;
    const avatarUrl = `https://github.com/${repo.owner}.png?size=100`;
    const statsUrl = `https://github-readme-stats.vercel.app/api?username=${repo.owner}&show_icons=true&theme=github_dark&hide_border=true`;
    const contributionUrl = `https://github-readme-streak-stats.herokuapp.com/?user=${repo.owner}&theme=github-dark-blue&hide_border=true`;
    
    return `
### ${index + 1}. [${repo.name}](${repo.url})

**Owner:** [@${repo.owner}](${profileUrl}) | **Language:** ${repo.language} | **${repo.starsToday}**

${repo.description}

<div align="center">

<img src="${avatarUrl}" width="100" alt="${repo.owner}" />

**${repo.owner}'s Profile**

![Stats](${statsUrl})

![Contribution Streak](${contributionUrl})

</div>

---
`;
  });
  
  return cards.join('\n');
}

/**
 * Update README with showcase
 */
async function updateReadme(showcase) {
  console.log('Reading README.md...');
  const readme = await readFile(README_PATH, 'utf8');
  
  const startMarker = '<!-- START: GH_SHOWCASE -->';
  const endMarker = '<!-- END: GH_SHOWCASE -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find GH_SHOWCASE markers in README.md');
    console.error(`Expected markers: '${startMarker}' and '${endMarker}'`);
    console.error('Please ensure these markers exist in README.md before running this script.');
    
    // Exit gracefully for CI
    console.log('Skipping update due to missing markers.');
    process.exit(0);
  }
  
  const newContent = `${startMarker}\n${showcase}\n${endMarker}`;
  
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
    const repos = await fetchTrending();
    const showcase = generateShowcase(repos);
    await updateReadme(showcase);
    
    console.log('✓ GitHub Showcase update complete!');
  } catch (error) {
    console.error('Error updating showcase:', error.message);
    process.exit(1);
  }
}

main();
