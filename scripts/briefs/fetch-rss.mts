#!/usr/bin/env node
/**
 * Fetch and aggregate RSS feeds for daily intelligence brief
 */

import Parser from 'rss-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import yaml from 'js-yaml';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'content'],
  },
});

const CONFIG_FILE = join(process.cwd(), 'config', 'feeds.yml');
const CACHE_DIR = join(process.cwd(), '.cache', 'rss');
const OUTPUT_DIR = join(process.cwd(), 'public', 'data');

// Ensure directories exist
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface FeedConfig {
  url: string;
  name: string;
  tags: string[];
  maxItems?: number;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  tags: string[];
  contentSnippet?: string;
  hash: string;
}

function generateHash(title: string, link: string): string {
  return createHash('md5').update(`${title}:${link}`).digest('hex');
}

async function fetchFeed(config: FeedConfig): Promise<FeedItem[]> {
  console.log(`Fetching feed: ${config.name} (${config.url})`);

  try {
    const feed = await parser.parseURL(config.url);
    const maxItems = config.maxItems || 10;

    return feed.items.slice(0, maxItems).map((item) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
      source: config.name,
      tags: config.tags,
      contentSnippet: item.contentSnippet || item.content || '',
      hash: generateHash(item.title || '', item.link || ''),
    }));
  } catch (error) {
    console.error(`Error fetching feed ${config.name}:`, error);
    return [];
  }
}

function deduplicateItems(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.hash)) {
      return false;
    }
    seen.add(item.hash);
    return true;
  });
}

function sanitizeContent(content: string): string {
  // Basic HTML sanitization - remove scripts and normalize whitespace
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500); // Limit length
}

async function main() {
  console.log('Starting RSS feed aggregation...');

  // Load feed configuration
  let feedConfigs: FeedConfig[] = [];
  if (existsSync(CONFIG_FILE)) {
    const configContent = readFileSync(CONFIG_FILE, 'utf-8');
    const config: any = yaml.load(configContent);
    feedConfigs = config.feeds || [];
  } else {
    // Default feeds if config doesn't exist
    console.warn('No feeds.yml found, using default feeds');
    feedConfigs = [
      {
        name: 'Hacker News',
        url: 'https://hnrss.org/frontpage',
        tags: ['tech', 'news'],
        maxItems: 10,
      },
      {
        name: 'GitHub Blog',
        url: 'https://github.blog/feed/',
        tags: ['github', 'dev'],
        maxItems: 5,
      },
      {
        name: 'DevOps',
        url: 'https://www.reddit.com/r/devops/.rss',
        tags: ['devops', 'tech'],
        maxItems: 5,
      },
    ];
  }

  // Fetch all feeds
  const allItems: FeedItem[] = [];
  for (const config of feedConfigs) {
    const items = await fetchFeed(config);
    allItems.push(...items);

    // Rate limiting - wait between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Deduplicate and sort by date
  const uniqueItems = deduplicateItems(allItems);
  uniqueItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return dateB - dateA; // Most recent first
  });

  // Sanitize content
  uniqueItems.forEach((item) => {
    if (item.contentSnippet) {
      item.contentSnippet = sanitizeContent(item.contentSnippet);
    }
  });

  // Group by tags
  const byTag: Record<string, FeedItem[]> = {};
  uniqueItems.forEach((item) => {
    item.tags.forEach((tag) => {
      if (!byTag[tag]) {
        byTag[tag] = [];
      }
      byTag[tag].push(item);
    });
  });

  // Create daily brief
  const brief = {
    date: new Date().toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
    totalItems: uniqueItems.length,
    sources: Array.from(new Set(uniqueItems.map((item) => item.source))),
    items: uniqueItems.slice(0, 50), // Limit to top 50 items
    byTag,
  };

  // Save to cache
  const cacheFile = join(CACHE_DIR, `brief-${brief.date}.json`);
  writeFileSync(cacheFile, JSON.stringify(brief, null, 2));
  console.log(`Cached brief to ${cacheFile}`);

  // Save to public data directory
  const outputFile = join(OUTPUT_DIR, 'daily-brief.json');
  writeFileSync(outputFile, JSON.stringify(brief, null, 2));
  console.log(`Saved brief to ${outputFile}`);

  console.log('✅ RSS feed aggregation complete!');
  console.log(`Total items: ${uniqueItems.length}`);
  console.log(`Sources: ${brief.sources.join(', ')}`);
  console.log(`Tags: ${Object.keys(byTag).join(', ')}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
