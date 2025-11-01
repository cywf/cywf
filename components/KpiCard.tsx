import React from 'react';
import styles from './KpiCard.module.css';
import clsx from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  sparkline?: number[];
  icon?: React.ReactNode;
  className?: string;
}

export default function KpiCard({ title, value, delta, sparkline, icon, className }: KpiCardProps) {
  const deltaColor = delta && delta > 0 ? styles.positive : delta && delta < 0 ? styles.negative : '';

  return (
    <div className={clsx(styles.card, className)}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value}>{value}</div>
      {delta !== undefined && (
        <div className={clsx(styles.delta, deltaColor)}>
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)}%
        </div>
      )}
      {sparkline && sparkline.length > 0 && (
        <div className={styles.sparkline}>
          {/* Simple SVG sparkline - can be enhanced with ECharts */}
          <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="var(--acc-1)"
              strokeWidth="2"
              points={sparkline
                .map((val, i) => {
                  const x = (i / (sparkline.length - 1)) * 100;
                  const y = 24 - (val / Math.max(...sparkline)) * 20;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
