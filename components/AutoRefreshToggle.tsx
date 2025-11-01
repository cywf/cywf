'use client';

import React, { useState, useEffect } from 'react';
import styles from './AutoRefreshToggle.module.css';

interface AutoRefreshToggleProps {
  onChange?: (enabled: boolean) => void;
}

export default function AutoRefreshToggle({ onChange }: AutoRefreshToggleProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('autoRefresh');
    if (stored === 'true') {
      setEnabled(true);
    }
  }, []);

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem('autoRefresh', String(newValue));
    onChange?.(newValue);
  };

  return (
    <button
      className={`${styles.toggle} ${enabled ? styles.active : ''}`}
      onClick={toggle}
      aria-label={`Auto-refresh is ${enabled ? 'on' : 'off'}`}
      title={`Auto-refresh is ${enabled ? 'on' : 'off'}`}
    >
      <span className={styles.icon}>🔄</span>
      <span className={styles.label}>Auto-refresh</span>
    </button>
  );
}
