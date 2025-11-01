import React from 'react';
import styles from './Panel.module.css';
import clsx from 'clsx';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

export default function Panel({ title, children, toolbar, className }: PanelProps) {
  return (
    <div className={clsx(styles.panel, className)}>
      {(title || toolbar) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
