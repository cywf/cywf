/**
 * Data client utilities with stale-while-revalidate logic
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

/**
 * Clean up old cache entries when cache grows too large
 */
function cleanupCache() {
  if (cache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    const entries = Array.from(cache.entries());
    
    // Remove expired entries first
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (cache.size > MAX_CACHE_SIZE) {
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, cache.size - MAX_CACHE_SIZE);
      for (const [key] of toRemove) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Fetch JSON with cache-busting and stale-while-revalidate
 */
export async function getJSON<T>(url: string, bustCache = false): Promise<T> {
  const cacheKey = url;
  const cached = cache.get(cacheKey);

  // Return cached data if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL && !bustCache) {
    return cached.data;
  }

  try {
    // Add cache-busting parameter if requested
    const fetchUrl = bustCache ? `${url}?v=${Date.now()}` : url;
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Update cache and clean up if needed
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    cleanupCache();

    return data;
  } catch (error) {
    // Return stale data if available
    if (cached) {
      console.warn(`Using stale data for ${url}:`, error);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Fetch HTML content
 */
export async function getHTML(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Load metrics data with proper typing
 */
export interface MetricsData {
  generatedAt: string;
  window: { from: string; to: string };
  tallies: {
    commits: number;
    prs: number;
    issues: number;
    reviews: number;
    privateRestrictedCount: number;
  };
  topReposByStars: Array<{
    nameWithOwner: string;
    stargazerCount: number;
    forkCount: number;
    isPrivate: boolean;
    isFork: boolean;
    primaryLanguage?: {
      name: string;
      color: string;
    };
  }>;
  timeseriesMonthly: Array<{
    month: string;
    commits: number;
    prs: number;
    issues: number;
  }>;
  activityByHour: Array<{
    hour: number;
    count: number;
  }>;
  languageKB: Array<{
    name: string;
    color: string;
    kb: number;
  }>;
  contributionCalendar: {
    weeks: Array<{
      contributionDays: Array<{
        date: string;
        contributionCount: number;
        weekday: number;
      }>;
    }>;
  };
}

export async function loadMetrics(): Promise<MetricsData | null> {
  try {
    return await getJSON<MetricsData>('/data/metrics.json', true);
  } catch (error) {
    console.error('Failed to load metrics:', error);
    return null;
  }
}

/**
 * Load gists data
 */
export interface GistsData {
  generatedAt: string;
  items: Array<{
    name: string;
    description: string;
    url: string;
    updatedAt: string;
    preview: string;
  }>;
}

export async function loadGists(): Promise<GistsData | null> {
  try {
    return await getJSON<GistsData>('/data/gists.json', true);
  } catch (error) {
    console.error('Failed to load gists:', error);
    return null;
  }
}

/**
 * Load Quote of the Day
 */
export interface QOTDData {
  source: string;
  data: any;
  fetchedAt: string;
}

export async function loadQOTD(): Promise<QOTDData | null> {
  try {
    return await getJSON<QOTDData>('/data/qotd.json', true);
  } catch (error) {
    console.error('Failed to load QOTD:', error);
    return null;
  }
}
