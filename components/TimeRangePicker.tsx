'use client';

import React, { useState } from 'react';
import styles from './TimeRangePicker.module.css';

interface TimeRangePickerProps {
  onChange?: (range: string) => void;
}

const ranges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'YTD', value: 'ytd' },
];

export default function TimeRangePicker({ onChange }: TimeRangePickerProps) {
  const [selected, setSelected] = useState('30d');

  const handleSelect = (value: string) => {
    setSelected(value);
    onChange?.(value);
  };

  return (
    <div className={styles.picker}>
      <span className={styles.label}>Time Range:</span>
      <div className={styles.buttons}>
        {ranges.map((range) => (
          <button
            key={range.value}
            className={`${styles.button} ${selected === range.value ? styles.active : ''}`}
            onClick={() => handleSelect(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
