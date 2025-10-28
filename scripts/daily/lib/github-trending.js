#!/usr/bin/env node

/**
 * GitHub Trending Repos Fetcher
 * Fetches trending repositories from GitHub
 */

const https = require('https');

/**
 * Fetch trending repositories using GitHub search API
 * (Alternative to scraping the trending page)
 */
function fetchTrendingRepos(token) {
  return new Promise((resolve, reject) => {
    // Get repos created in the last week with most stars
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateStr = oneWeekAgo.toISOString().split('T')[0];
    
    const query = `created:>${dateStr} stars:>50`;
    const searchPath = `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=3`;
    
    const options = {
      hostname: 'api.github.com',
      path: searchPath,
      method: 'GET',
      headers: {
        'User-Agent': 'cywf-daily-brief',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }
    
    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result.items || []);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Format trending repos as markdown
 */
function formatTrendingMarkdown(repos) {
  if (!repos || repos.length === 0) {
    return '**No trending repositories available** ⛔';
  }
  
  let md = `### 🔥 Trending GitHub Repositories\n\n`;
  
  repos.forEach((repo, index) => {
    md += `${index + 1}. **[${repo.full_name}](${repo.html_url})** ⭐ ${repo.stargazers_count.toLocaleString()}\n`;
    if (repo.description) {
      md += `   _${repo.description}_\n`;
    }
    if (repo.language) {
      md += `   📝 ${repo.language}`;
    }
    if (repo.topics && repo.topics.length > 0) {
      md += ` | Topics: ${repo.topics.slice(0, 3).join(', ')}`;
    }
    md += `\n\n`;
  });
  
  return md;
}

module.exports = {
  fetchTrendingRepos,
  formatTrendingMarkdown
};

// CLI test
if (require.main === module) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  fetchTrendingRepos(token).then(repos => {
    console.log(formatTrendingMarkdown(repos));
  }).catch(err => {
    console.error('Error:', err.message);
  });
}
