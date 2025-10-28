#!/usr/bin/env node

/**
 * News Feed Parser
 * Fetches and parses RSS feeds for global intelligence news (GRINTSUM)
 */

const https = require('https');

const NEWS_FEEDS = [
  {
    name: 'Reuters World News',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best'
  }
];

/**
 * Parse RSS feed XML to extract items
 */
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;
  const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
  
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = titleRegex.exec(itemXml);
    const linkMatch = linkRegex.exec(itemXml);
    const descMatch = descRegex.exec(itemXml);
    const dateMatch = dateRegex.exec(itemXml);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: (titleMatch[1] || titleMatch[2] || '').trim(),
        link: (linkMatch[1] || '').trim(),
        description: (descMatch ? (descMatch[1] || descMatch[2] || '') : '').trim().substring(0, 200),
        date: dateMatch ? new Date(dateMatch[1]) : new Date()
      });
    }
  }
  
  return items;
}

/**
 * Fetch RSS feed
 */
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`RSS feed returned status ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch top news stories from multiple sources
 */
async function fetchNews(maxStories = 5) {
  const allStories = [];
  
  for (const feed of NEWS_FEEDS) {
    try {
      console.log(`Fetching news from ${feed.name}...`);
      const xml = await fetchRSS(feed.url);
      const items = parseRSS(xml);
      allStories.push(...items.slice(0, maxStories));
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
    }
  }
  
  // Sort by date and return top stories
  return allStories
    .sort((a, b) => b.date - a.date)
    .slice(0, maxStories);
}

/**
 * Format news as markdown
 */
function formatNewsMarkdown(stories) {
  if (!stories || stories.length === 0) {
    return '**No news stories available** ⛔';
  }
  
  let md = `### 📰 Global Intelligence News (GRINTSUM)\n\n`;
  
  stories.forEach((story, index) => {
    const dateStr = story.date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    md += `${index + 1}. **[${story.title}](${story.link})**\n`;
    if (story.description) {
      md += `   _${story.description}..._\n`;
    }
    md += `   _Published: ${dateStr}_\n\n`;
  });
  
  return md;
}

module.exports = {
  fetchNews,
  formatNewsMarkdown
};

// CLI test
if (require.main === module) {
  fetchNews(5).then(stories => {
    console.log(formatNewsMarkdown(stories));
  });
}
