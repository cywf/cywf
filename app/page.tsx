'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Panel from '@/components/Panel';
import KpiCard from '@/components/KpiCard';
import Heatmap from '@/components/charts/Heatmap';
import BarChart from '@/components/charts/BarChart';
import styles from './page.module.css';
import { getMockAnalytics } from '@/lib/data';

export default function Home() {
  const [timeRange, setTimeRange] = useState('30d');
  const analytics = getMockAnalytics();
  
  // Get data for selected time range
  const rangeData = analytics.contributions[timeRange] || analytics.contributions['30d'];
  
  // Prepare KPI data
  const kpis = [
    { 
      title: 'Total Stars', 
      value: analytics.kpis.totalStars.toLocaleString(), 
      delta: 15,
    },
    { 
      title: 'Total Commits', 
      value: rangeData.commits.toLocaleString(), 
      delta: 8,
    },
    { 
      title: 'Pull Requests', 
      value: rangeData.pullRequests.toLocaleString(), 
      delta: -3,
    },
    { 
      title: 'Contribution Streak', 
      value: `${analytics.kpis.contributionStreak} days`, 
      delta: 12,
    },
  ];

  // Prepare chart data
  const topRepos = analytics.repositories
    .slice(0, 10)
    .map(repo => ({ name: repo.name, value: repo.stars }));

  const languages = Object.values(analytics.languages)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10)
    .map(lang => ({ name: lang.name, value: Math.round(lang.bytes / 1024) }));

  // Mock activity by hour data
  const activityByHour = Array.from({ length: 24 }, (_, i) => ({
    name: `${i}:00`,
    value: Math.floor(Math.random() * 100) + 10,
  }));

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

          <section className={styles.chartsGrid}>
            <Panel title="Contribution Heatmap (365 days)" className={styles.fullWidth}>
              <Heatmap data={rangeData.calendar} />
            </Panel>

            <Panel title="Activity by Hour (UTC)">
              <BarChart data={activityByHour} />
            </Panel>

            <Panel title="Top Repositories by Stars">
              <BarChart data={topRepos} horizontal />
            </Panel>

            <Panel title="Language Distribution (KB)" className={styles.fullWidth}>
              <BarChart data={languages} horizontal />
            </Panel>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>CYWF Analytics Dashboard • Last updated: {new Date(analytics.lastUpdated).toLocaleString()}</p>
      </footer>
    </div>
  );
}
