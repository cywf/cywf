#!/usr/bin/env node

/**
 * Daily Quote Fetcher
 * Fetches inspirational quote from ZenQuotes API
 */

const https = require('https');

const ZENQUOTES_URL = 'zenquotes.io';

/**
 * Fetch daily quote from ZenQuotes
 */
function fetchQuote() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: ZENQUOTES_URL,
      path: '/api/today',
      method: 'GET',
      headers: {
        'User-Agent': 'cywf-daily-brief'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const quotes = JSON.parse(data);
            if (quotes && quotes.length > 0) {
              resolve({
                text: quotes[0].q,
                author: quotes[0].a
              });
            } else {
              resolve(getFallbackQuote());
            }
          } catch (e) {
            resolve(getFallbackQuote());
          }
        } else {
          resolve(getFallbackQuote());
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching quote:', error.message);
      resolve(getFallbackQuote());
    });
  });
}

/**
 * Fallback quote when API is unavailable
 */
function getFallbackQuote() {
  const fallbacks = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" }
  ];
  
  const index = new Date().getDate() % fallbacks.length;
  return fallbacks[index];
}

/**
 * Format quote as markdown
 */
function formatQuoteMarkdown(quote) {
  if (!quote) {
    return '';
  }
  
  return `### 💭 Quote of the Day\n\n> "${quote.text}"\n>\n> — **${quote.author}**\n`;
}

module.exports = {
  fetchQuote,
  formatQuoteMarkdown
};

// CLI test
if (require.main === module) {
  fetchQuote().then(quote => {
    console.log(formatQuoteMarkdown(quote));
  });
}
