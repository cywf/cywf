'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Panel from '@/components/Panel';
import KpiCard from '@/components/KpiCard';
import Heatmap from '@/components/charts/Heatmap';
import BarChart from '@/components/charts/BarChart';
import DonutChart from '@/components/charts/DonutChart';
import StackedBarChart from '@/components/charts/StackedBarChart';
import ActivityByHourChart from '@/components/charts/ActivityByHourChart';
import LanguageDistribution from '@/components/charts/LanguageDistribution';
import MermaidPanel from '@/components/MermaidPanel';
import GistsPanel from '@/components/GistsPanel';
import DailyBrief from '@/components/DailyBrief';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import styles from './page.module.css';
import { getMockAnalytics } from '@/lib/data';
import { loadMetrics, type MetricsData } from '@/lib/utils/dataClient';

export default function Home() {
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const analytics = getMockAnalytics();

  useEffect(() => {
    loadMetrics().then((data) => {
      if (data) {
        setMetrics(data);
      }
    });
  }, []);
  
  // Get data for selected time range
  const rangeData = analytics.contributions[timeRange] || analytics.contributions['30d'];
  
  // Use real metrics data if available, otherwise fallback to mock
  const tallies = metrics?.tallies || {
    commits: rangeData.commits,
    prs: rangeData.pullRequests,
    issues: rangeData.issues,
    reviews: 0,
  };

  const topReposByStars = metrics?.topReposByStars || analytics.repositories;
  const languageData = metrics?.languageKB || Object.values(analytics.languages).map(l => ({
    name: l.name,
    color: l.color,
    kb: Math.round(l.bytes / 1024)
  }));
  const activityByHourData = metrics?.activityByHour || Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: Math.floor(Math.random() * 100) + 10,
  }));
  const timeseriesMonthly = metrics?.timeseriesMonthly || [];
  
  // Helper function to get star count (handles both data structures)
  const getStarCount = (repo: any): number => {
    return repo.stargazerCount ?? repo.stars ?? 0;
  };

  const getRepoName = (repo: any): string => {
    return repo.nameWithOwner ?? repo.name ?? 'Unknown';
  };
  
  // Prepare KPI data
  const kpis = [
    { 
      title: 'Total Stars', 
      value: topReposByStars.reduce((sum, r) => sum + getStarCount(r), 0).toLocaleString(), 
      delta: 15,
    },
    { 
      title: 'Total Commits', 
      value: tallies.commits.toLocaleString(), 
      delta: 8,
    },
    { 
      title: 'Pull Requests', 
      value: tallies.prs.toLocaleString(), 
      delta: -3,
    },
    { 
      title: 'Issues & Reviews', 
      value: (tallies.issues + tallies.reviews).toLocaleString(), 
      delta: 12,
    },
  ];

  // Prepare chart data
  const topRepos = topReposByStars
    .slice(0, 10)
    .map(repo => ({ name: getRepoName(repo), value: getStarCount(repo) }));

  const languages = languageData
    .sort((a, b) => b.kb - a.kb)
    .slice(0, 10);

  // Donut chart data
  const activityRatioData = [
    { name: 'Commits', value: tallies.commits },
    { name: 'PRs', value: tallies.prs },
    { name: 'Issues', value: tallies.issues },
  ];

  // Stacked bar chart data (last 12 months)
  const last12Months = timeseriesMonthly.slice(-12);
  const stackedData = {
    labels: last12Months.map(m => m.month),
    datasets: [
      { name: 'Commits', data: last12Months.map(m => m.commits), color: '#1FD96A' },
      { name: 'PRs', data: last12Months.map(m => m.prs), color: '#2AFD7B' },
      { name: 'Issues', data: last12Months.map(m => m.issues), color: '#3AFF81' },
    ],
  };

  return (
    <div className={styles.dashboard}>
      <Header 
        onTimeRangeChange={(range) => setTimeRange(range)}
      />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.kpiGrid}>
            {kpis.map((kpi, index) => (
              <KpiCard key={index} {...kpi} />
            ))}
          </section>

          {/* New: Activity Ratio and Monthly Trends */}
          <section className={styles.chartsGrid}>
            <Panel title="Activity Ratio: PRs vs Issues vs Commits">
              <DonutChart data={activityRatioData} colors={['#2AFD7B', '#3AFF81', '#1FD96A']} />
            </Panel>

            <Panel title="Monthly Activity Trends (Last 12 Months)">
              {stackedData.labels.length > 0 ? (
                <StackedBarChart data={stackedData} />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#a6cbb7' }}>
                  No data available yet. Run the metrics workflow to fetch data.
                </div>
              )}
            </Panel>
          </section>

          <section className={styles.chartsGrid}>
            <Panel title="Contribution Heatmap (365 days)" className={styles.fullWidth}>
              <Heatmap data={rangeData.calendar} />
            </Panel>

            <Panel title="Activity by Hour (UTC)">
              <ActivityByHourChart data={activityByHourData} />
            </Panel>

            <Panel title="Top Repositories by Stars (Owned + Contributed/Public)">
              <BarChart data={topRepos} horizontal />
            </Panel>

            <Panel title="Language Distribution (Weighted by Stars)" className={styles.fullWidth}>
              <LanguageDistribution data={languages} />
            </Panel>
          </section>

          {/* New: Mermaid Playground */}
          <section className={styles.fullWidth}>
            <Panel title="Mermaid Diagram Playground" className={styles.fullWidth}>
              <MermaidPanel />
            </Panel>
          </section>

          {/* New: Daily Brief */}
          <section className={styles.fullWidth}>
            <Panel title="Daily Brief" className={styles.fullWidth}>
              <DailyBrief />
            </Panel>
          </section>

          {/* New: Latest Gists */}
          <section className={styles.fullWidth}>
            <Panel title="Latest Public Gists" className={styles.fullWidth}>
              <GistsPanel />
            </Panel>
          </section>

          {/* New: Quote of the Day */}
          <section className={styles.fullWidth}>
            <Panel title="Quote of the Day" className={styles.fullWidth}>
              <QuoteOfTheDay />
            </Panel>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>CYWF Analytics Dashboard • Last updated: {metrics ? new Date(metrics.generatedAt).toLocaleString() : new Date(analytics.lastUpdated).toLocaleString()}</p>
        <p style={{ fontSize: '0.85rem', color: '#a6cbb7', marginTop: '0.5rem' }}>
          All non-owned contributions displayed are PUBLIC-only • No private data is shown
        </p>
      </footer>
    </div>
  );
}
