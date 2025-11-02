/**
 * Data client utilities with stale-while-revalidate logic
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Update cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

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
