import React from 'react';
import styles from './Header.module.css';
import TimeRangePicker from './TimeRangePicker';
import ThemeToggle from './ThemeToggle';
import AutoRefreshToggle from './AutoRefreshToggle';

interface HeaderProps {
  onTimeRangeChange?: (range: string) => void;
  onAutoRefreshToggle?: (enabled: boolean) => void;
}

export default function Header({ onTimeRangeChange, onAutoRefreshToggle }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <h1 className={styles.title}>CYWF Analytics</h1>
        </div>
        <TimeRangePicker onChange={onTimeRangeChange} />
      </div>
      <div className={styles.right}>
        <AutoRefreshToggle onChange={onAutoRefreshToggle} />
        <ThemeToggle />
      </div>
    </header>
  );
}
