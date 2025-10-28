#!/usr/bin/env node

/**
 * Daily Brief Generator
 * Orchestrates data collection and generates the daily intelligence brief
 */

const fs = require('fs');
const path = require('path');

// Import data collectors
const { fetchCurrentWeather, fetchForecast, formatWeatherMarkdown } = require('./lib/weather.js');
const { fetchNews, formatNewsMarkdown } = require('./lib/news.js');
const { fetchSpaceWeatherAlerts, fetchKpIndex, formatSpaceWeatherMarkdown } = require('./lib/space-weather.js');
const { fetchQuote, formatQuoteMarkdown } = require('./lib/quote.js');
const { fetchTrendingRepos, formatTrendingMarkdown } = require('./lib/github-trending.js');

// Configuration
const README_PATH = path.join(__dirname, '..', '..', 'README.md');
const DAILY_DIR = path.join(__dirname, '..', '..', 'daily');
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'daily');

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  if (!fs.existsSync(DAILY_DIR)) {
    fs.mkdirSync(DAILY_DIR, { recursive: true });
  }
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
}

/**
 * Get current date in various formats
 */
function getDateFormats() {
  const now = new Date();
  return {
    iso: now.toISOString().split('T')[0], // YYYY-MM-DD
    long: now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    time: now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    })
  };
}

/**
 * Fetch all data with error handling
 */
async function fetchAllData() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  
  console.log('🔄 Fetching data from all sources...\n');
  
  const results = {
    weather: null,
    forecast: null,
    news: null,
    spaceAlerts: null,
    kpIndex: null,
    quote: null,
    trending: null
  };
  
  // Fetch all data in parallel with individual error handling
  try {
    const [weather, forecast, news, spaceAlerts, kpIndex, quote, trending] = await Promise.allSettled([
      fetchCurrentWeather(apiKey),
      fetchForecast(apiKey),
      fetchNews(5),
      fetchSpaceWeatherAlerts(),
      fetchKpIndex(),
      fetchQuote(),
      fetchTrendingRepos(ghToken)
    ]);
    
    results.weather = weather.status === 'fulfilled' ? weather.value : null;
    results.forecast = forecast.status === 'fulfilled' ? forecast.value : null;
    results.news = news.status === 'fulfilled' ? news.value : null;
    results.spaceAlerts = spaceAlerts.status === 'fulfilled' ? spaceAlerts.value : null;
    results.kpIndex = kpIndex.status === 'fulfilled' ? kpIndex.value : null;
    results.quote = quote.status === 'fulfilled' ? quote.value : null;
    results.trending = trending.status === 'fulfilled' ? trending.value : null;
    
    // Log what succeeded
    console.log('✅ Weather:', results.weather ? 'OK' : 'Failed');
    console.log('✅ Forecast:', results.forecast ? 'OK' : 'Failed');
    console.log('✅ News:', results.news ? `${results.news.length} stories` : 'Failed');
    console.log('✅ Space Weather:', results.spaceAlerts ? 'OK' : 'Failed');
    console.log('✅ Quote:', results.quote ? 'OK' : 'Failed');
    console.log('✅ Trending Repos:', results.trending ? `${results.trending.length} repos` : 'Failed');
    console.log('');
    
  } catch (error) {
    console.error('⚠️  Error during data fetch:', error.message);
  }
  
  return results;
}

/**
 * Generate markdown content for the daily brief
 */
function generateBriefMarkdown(data, dates) {
  let content = '';
  
  // Header with date
  content += `<div align="center">\n\n`;
  content += `# 📅 Daily Brief\n\n`;
  content += `**${dates.long}**\n\n`;
  content += `</div>\n\n`;
  content += `---\n\n`;
  
  // Quote
  if (data.quote) {
    content += `<details>\n<summary><b>💭 Quote of the Day</b></summary>\n\n`;
    content += formatQuoteMarkdown(data.quote);
    content += `\n</details>\n\n`;
  }
  
  // Weather
  content += `<details>\n<summary><b>🌤️ Weather Report</b></summary>\n\n`;
  content += formatWeatherMarkdown(data.weather, data.forecast);
  content += `\n</details>\n\n`;
  
  // News
  content += `<details>\n<summary><b>📰 Global Intelligence News</b></summary>\n\n`;
  content += formatNewsMarkdown(data.news);
  content += `\n</details>\n\n`;
  
  // Space Weather
  content += `<details>\n<summary><b>🌌 Space Weather</b></summary>\n\n`;
  content += formatSpaceWeatherMarkdown(data.spaceAlerts, data.kpIndex);
  content += `\n</details>\n\n`;
  
  // GitHub Trending
  content += `<details>\n<summary><b>🔥 Trending on GitHub</b></summary>\n\n`;
  content += formatTrendingMarkdown(data.trending);
  content += `\n</details>\n\n`;
  
  content += `---\n\n`;
  content += `<div align="center">\n\n`;
  content += `_Generated at ${dates.time}_\n\n`;
  content += `</div>\n`;
  
  return content;
}

/**
 * Update README.md with the daily brief
 */
function updateReadme(briefContent) {
  try {
    let readme = fs.readFileSync(README_PATH, 'utf8');
    
    // Find and replace content between markers
    const startMarker = '<!-- BEGIN DAILY BRIEF -->';
    const endMarker = '<!-- END DAILY BRIEF -->';
    
    const startIndex = readme.indexOf(startMarker);
    const endIndex = readme.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const before = readme.substring(0, startIndex + startMarker.length);
      const after = readme.substring(endIndex);
      
      const wrappedContent = `\n<details>\n<summary><b>📰 Today's Intelligence Brief</b></summary>\n\n${briefContent}\n\n</details>\n`;
      
      readme = before + wrappedContent + after;
      
      fs.writeFileSync(README_PATH, readme, 'utf8');
      console.log('✅ README.md updated successfully');
      return true;
    } else {
      console.error('⚠️  Daily brief markers not found in README.md');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating README:', error.message);
    return false;
  }
}

/**
 * Create daily archive file
 */
function createArchive(briefContent, dates) {
  try {
    const archivePath = path.join(DAILY_DIR, `${dates.iso}.md`);
    
    let archiveContent = `---\n`;
    archiveContent += `date: ${dates.iso}\n`;
    archiveContent += `title: "Daily Brief - ${dates.long}"\n`;
    archiveContent += `generated: ${new Date().toISOString()}\n`;
    archiveContent += `---\n\n`;
    archiveContent += briefContent;
    
    fs.writeFileSync(archivePath, archiveContent, 'utf8');
    console.log(`✅ Archive created: ${archivePath}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating archive:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Daily Brief Generation\n');
  console.log('='.repeat(50) + '\n');
  
  // Ensure directories exist
  ensureDirectories();
  
  // Get date information
  const dates = getDateFormats();
  console.log(`📅 Date: ${dates.long}\n`);
  
  // Fetch all data
  const data = await fetchAllData();
  
  // Generate markdown content
  console.log('📝 Generating markdown content...');
  const briefContent = generateBriefMarkdown(data, dates);
  
  // Update README
  console.log('📄 Updating README.md...');
  const readmeUpdated = updateReadme(briefContent);
  
  // Create archive
  console.log('📁 Creating daily archive...');
  const archiveCreated = createArchive(briefContent, dates);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Daily Brief Generation Complete!\n');
  console.log(`README Updated: ${readmeUpdated ? '✅' : '❌'}`);
  console.log(`Archive Created: ${archiveCreated ? '✅' : '❌'}`);
  console.log('\n' + '='.repeat(50));
  
  // Exit with appropriate code
  process.exit((readmeUpdated && archiveCreated) ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateBriefMarkdown, fetchAllData };
