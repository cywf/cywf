#!/usr/bin/env node
/**
 * Fetch GitHub analytics using GraphQL API
 * Focuses on public contributions only for privacy
 */

import { graphql } from '@octokit/graphql';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'cywf';
const CACHE_DIR = join(process.cwd(), '.cache', 'github');
const OUTPUT_DIR = join(process.cwd(), 'public', 'data');

// Ensure directories exist
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionsCollection {
  contributionCalendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
  restrictedContributionsCount: number;
}

async function fetchContributions(from: string, to: string) {
  console.log(`Fetching contributions from ${from} to ${to}...`);

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoriesWithContributedCommits
          restrictedContributionsCount
        }
      }
    }
  `;

  try {
    const result: any = await graphql({
      query,
      username: GITHUB_USERNAME,
      from,
      to,
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    return result.user.contributionsCollection as ContributionsCollection;
  } catch (error) {
    console.error('Error fetching contributions:', error);
    throw error;
  }
}

async function fetchRepositories() {
  console.log('Fetching repositories...');

  const query = `
    query($username: String!) {
      user(login: $username) {
        repositories(
          first: 100
          orderBy: { field: STARGAZERS, direction: DESC }
          privacy: PUBLIC
          ownerAffiliations: [OWNER]
        ) {
          nodes {
            name
            description
            stargazerCount
            forkCount
            primaryLanguage {
              name
              color
            }
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
            createdAt
            updatedAt
            isPrivate
          }
        }
      }
    }
  `;

  try {
    const result: any = await graphql({
      query,
      username: GITHUB_USERNAME,
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    return result.user.repositories.nodes;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
}

function getDateRanges() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  return {
    ytd: {
      from: yearStart.toISOString(),
      to: now.toISOString(),
    },
    year: {
      from: oneYearAgo.toISOString(),
      to: now.toISOString(),
    },
    '90d': {
      from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      to: now.toISOString(),
    },
    '30d': {
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: now.toISOString(),
    },
    '7d': {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: now.toISOString(),
    },
  };
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('ERROR: GITHUB_TOKEN or GH_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log(`Fetching GitHub analytics for user: ${GITHUB_USERNAME}`);

  const ranges = getDateRanges();
  const analytics: any = {
    username: GITHUB_USERNAME,
    lastUpdated: new Date().toISOString(),
    contributions: {},
    repositories: [],
    languages: {},
  };

  // Fetch contributions for each time range
  for (const [key, range] of Object.entries(ranges)) {
    try {
      const data = await fetchContributions(range.from, range.to);
      
      // Use totalCommitContributions as-is since it should already represent public contributions
      // restrictedContributionsCount is a separate field that counts private contributions
      // We display the public commit count directly
      const publicCommits = data.totalCommitContributions;
      
      analytics.contributions[key] = {
        total: data.contributionCalendar.totalContributions,
        commits: publicCommits,
        issues: data.totalIssueContributions,
        pullRequests: data.totalPullRequestContributions,
        reviews: data.totalPullRequestReviewContributions,
        repositories: data.totalRepositoriesWithContributedCommits,
        calendar: data.contributionCalendar.weeks.flatMap((week) =>
          week.contributionDays.map((day) => [day.date, day.contributionCount])
        ),
      };

      // Add delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to fetch ${key} contributions:`, error);
    }
  }

  // Fetch repositories
  try {
    const repos = await fetchRepositories();
    analytics.repositories = repos.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      language: repo.primaryLanguage?.name,
      languageColor: repo.primaryLanguage?.color,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
    }));

    // Aggregate languages
    repos.forEach((repo: any) => {
      if (repo.languages?.edges) {
        repo.languages.edges.forEach((edge: any) => {
          const lang = edge.node.name;
          const size = edge.size;
          if (!analytics.languages[lang]) {
            analytics.languages[lang] = {
              name: lang,
              color: edge.node.color || '#cccccc',
              bytes: 0,
            };
          }
          analytics.languages[lang].bytes += size;
        });
      }
    });
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
  }

  // Calculate some KPIs
  const totalStars = analytics.repositories.reduce((sum: number, repo: any) => sum + repo.stars, 0);
  const contributionData = analytics.contributions['year'] || analytics.contributions['ytd'] || {};
  
  analytics.kpis = {
    totalStars,
    totalCommits: contributionData.commits || 0,
    totalPRs: contributionData.pullRequests || 0,
    totalIssues: contributionData.issues || 0,
    totalRepos: analytics.repositories.length,
    contributionStreak: 0, // Calculate from calendar data
  };

  // Calculate contribution streak
  if (contributionData.calendar) {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = contributionData.calendar.length - 1; i >= 0; i--) {
      const [date, count] = contributionData.calendar[i];
      if (count > 0) {
        streak++;
      } else if (date < today) {
        // Only break streak if it's a past day with no contributions
        break;
      }
    }
    analytics.kpis.contributionStreak = streak;
  }

  // Save to cache
  const cacheFile = join(CACHE_DIR, 'analytics.json');
  writeFileSync(cacheFile, JSON.stringify(analytics, null, 2));
  console.log(`Cached analytics to ${cacheFile}`);

  // Save to public data directory
  const outputFile = join(OUTPUT_DIR, 'github-analytics.json');
  writeFileSync(outputFile, JSON.stringify(analytics, null, 2));
  console.log(`Saved analytics to ${outputFile}`);

  console.log('✅ GitHub analytics fetch complete!');
  console.log(`Total repositories: ${analytics.repositories.length}`);
  console.log(`Total stars: ${analytics.kpis.totalStars}`);
  console.log(`Languages tracked: ${Object.keys(analytics.languages).length}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
