import React from 'react';
import Header from '@/components/Header';
import Panel from '@/components/Panel';
import KpiCard from '@/components/KpiCard';
import styles from './page.module.css';

export default function Home() {
  // Mock data for now - will be replaced with real data from scripts
  const kpis = [
    { title: 'Total Stars', value: '1.2K', delta: 15, sparkline: [10, 20, 15, 30, 25, 40, 35] },
    { title: 'Total Commits', value: '3.5K', delta: 8, sparkline: [40, 45, 42, 50, 55, 60, 58] },
    { title: 'Pull Requests', value: '127', delta: -3, sparkline: [20, 18, 22, 19, 21, 17, 20] },
    { title: 'Issues Closed', value: '89', delta: 12, sparkline: [10, 15, 12, 18, 20, 22, 25] },
  ];

  return (
    <div className={styles.dashboard}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.kpiGrid}>
            {kpis.map((kpi, index) => (
              <KpiCard key={index} {...kpi} />
            ))}
          </section>

          <section className={styles.chartsGrid}>
            <Panel title="Contribution Heatmap" className={styles.fullWidth}>
              <div className={styles.placeholder}>
                <p>Contribution heatmap will be displayed here</p>
                <p className={styles.muted}>365-day GitHub contribution calendar</p>
              </div>
            </Panel>

            <Panel title="Activity by Hour">
              <div className={styles.placeholder}>
                <p>Activity by hour chart</p>
                <p className={styles.muted}>Bar chart showing commits by hour (UTC)</p>
              </div>
            </Panel>

            <Panel title="Stars by Repository">
              <div className={styles.placeholder}>
                <p>Stars gained by repository</p>
                <p className={styles.muted}>Top 10 public repositories</p>
              </div>
            </Panel>

            <Panel title="Language Distribution" className={styles.fullWidth}>
              <div className={styles.placeholder}>
                <p>Language composition</p>
                <p className={styles.muted}>Horizontal stacked bars by language</p>
              </div>
            </Panel>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>CYWF Analytics Dashboard • Last updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
}
