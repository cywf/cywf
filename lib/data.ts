/**
 * Data loading utilities for GitHub analytics and RSS briefs
 * Client-side compatible version
 */

export interface GitHubAnalytics {
  username: string;
  lastUpdated: string;
  contributions: Record<
    string,
    {
      total: number;
      commits: number;
      issues: number;
      pullRequests: number;
      reviews: number;
      repositories: number;
      calendar: Array<[string, number]>;
    }
  >;
  repositories: Array<{
    name: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    languageColor: string;
    createdAt: string;
    updatedAt: string;
  }>;
  languages: Record<
    string,
    {
      name: string;
      color: string;
      bytes: number;
    }
  >;
  kpis: {
    totalStars: number;
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalRepos: number;
    contributionStreak: number;
  };
}

export interface DailyBrief {
  date: string;
  generatedAt: string;
  totalItems: number;
  sources: string[];
  items: Array<{
    title: string;
    link: string;
    pubDate: string;
    source: string;
    tags: string[];
    contentSnippet?: string;
    hash: string;
  }>;
  byTag: Record<string, any[]>;
}

export async function loadGitHubAnalytics(): Promise<GitHubAnalytics | null> {
  try {
    const response = await fetch('/cywf/data/github-analytics.json');
    if (!response.ok) {
      console.warn('GitHub analytics data not found');
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading GitHub analytics:', error);
    return null;
  }
}

export async function loadDailyBrief(): Promise<DailyBrief | null> {
  try {
    const response = await fetch('/cywf/data/daily-brief.json');
    if (!response.ok) {
      console.warn('Daily brief data not found');
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading daily brief:', error);
    return null;
  }
}

// Mock data generators for development
export function getMockAnalytics(): GitHubAnalytics {
  const calendar: Array<[string, number]> = [];
  const now = new Date();
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    calendar.push([date.toISOString().split('T')[0], Math.floor(Math.random() * 20)]);
  }

  return {
    username: 'cywf',
    lastUpdated: new Date().toISOString(),
    contributions: {
      year: {
        total: 2456,
        commits: 1842,
        issues: 234,
        pullRequests: 287,
        reviews: 93,
        repositories: 45,
        calendar,
      },
      '30d': {
        total: 245,
        commits: 187,
        issues: 23,
        pullRequests: 28,
        reviews: 7,
        repositories: 12,
        calendar: calendar.slice(-30),
      },
    },
    repositories: [
      {
        name: 'FortiPath',
        description: 'Advanced network path analysis with ML',
        stars: 342,
        forks: 45,
        language: 'Python',
        languageColor: '#3572A5',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2025-10-28T00:00:00Z',
      },
      {
        name: 'sentinel-project',
        description: 'Autonomous threat detection system',
        stars: 289,
        forks: 38,
        language: 'Go',
        languageColor: '#00ADD8',
        createdAt: '2024-03-20T00:00:00Z',
        updatedAt: '2025-10-25T00:00:00Z',
      },
      {
        name: 'AegisNet',
        description: 'AI-driven secure network architecture',
        stars: 215,
        forks: 29,
        language: 'TypeScript',
        languageColor: '#3178c6',
        createdAt: '2024-05-10T00:00:00Z',
        updatedAt: '2025-10-20T00:00:00Z',
      },
    ],
    languages: {
      Python: { name: 'Python', color: '#3572A5', bytes: 1250000 },
      TypeScript: { name: 'TypeScript', color: '#3178c6', bytes: 980000 },
      Go: { name: 'Go', color: '#00ADD8', bytes: 750000 },
      JavaScript: { name: 'JavaScript', color: '#f1e05a', bytes: 520000 },
      Rust: { name: 'Rust', color: '#dea584', bytes: 380000 },
    },
    kpis: {
      totalStars: 1247,
      totalCommits: 1842,
      totalPRs: 287,
      totalIssues: 234,
      totalRepos: 45,
      contributionStreak: 23,
    },
  };
}

export function getMockBrief(): DailyBrief {
  const mockItems = [
    {
      title: 'New AI Model Breaks Records in Benchmark Tests',
      link: 'https://example.com/ai-model-1',
      pubDate: new Date().toISOString(),
      source: 'Hacker News',
      tags: ['ai', 'tech'],
      contentSnippet: 'A new AI model has broken previous records in several benchmark tests...',
      hash: 'abc123',
    },
    {
      title: 'GitHub Copilot X: The Future of AI-Powered Development',
      link: 'https://example.com/copilot-x',
      pubDate: new Date().toISOString(),
      source: 'GitHub Blog',
      tags: ['github', 'dev', 'ai'],
      contentSnippet: 'GitHub announces Copilot X, bringing AI chat and voice to developers...',
      hash: 'def456',
    },
    {
      title: 'Kubernetes 1.28 Released with Major Improvements',
      link: 'https://example.com/k8s-release',
      pubDate: new Date().toISOString(),
      source: 'Kubernetes Blog',
      tags: ['devops', 'kubernetes'],
      contentSnippet: 'The latest Kubernetes release includes significant performance improvements...',
      hash: 'ghi789',
    },
    {
      title: 'Critical Security Vulnerability Found in Popular Library',
      link: 'https://example.com/security-vuln',
      pubDate: new Date().toISOString(),
      source: 'The Hacker News',
      tags: ['security', 'cyber'],
      contentSnippet: 'Security researchers have discovered a critical vulnerability that affects...',
      hash: 'jkl012',
    },
    {
      title: 'Modern CSS Techniques for 2025',
      link: 'https://example.com/css-2025',
      pubDate: new Date().toISOString(),
      source: 'CSS Tricks',
      tags: ['web', 'css', 'frontend'],
      contentSnippet: 'Explore the latest CSS features and techniques that are shaping web design...',
      hash: 'mno345',
    },
  ];

  const byTag: Record<string, any[]> = {
    tech: mockItems.filter(item => item.tags.includes('tech')),
    ai: mockItems.filter(item => item.tags.includes('ai')),
    security: mockItems.filter(item => item.tags.includes('security')),
    dev: mockItems.filter(item => item.tags.includes('dev')),
    devops: mockItems.filter(item => item.tags.includes('devops')),
    web: mockItems.filter(item => item.tags.includes('web')),
  };

  return {
    date: new Date().toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
    totalItems: mockItems.length,
    sources: ['Hacker News', 'GitHub Blog', 'Kubernetes Blog', 'The Hacker News', 'CSS Tricks'],
    items: mockItems,
    byTag,
  };
}
