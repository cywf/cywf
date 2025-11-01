'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Panel from '@/components/Panel';
import styles from './page.module.css';
import { getMockBrief } from '@/lib/data';
import { prefixPath } from '@/lib/utils';

export default function IntelPage() {
  const brief = getMockBrief();

  return (
    <div className={styles.dashboard}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Daily Intelligence Brief</h1>
              <p className={styles.pageSubtitle}>
                {new Date(brief.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <Link href={prefixPath('/')} className={styles.backLink}>
              ← Back to Dashboard
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{brief.totalItems}</span>
              <span className={styles.statLabel}>Total Items</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{brief.sources.length}</span>
              <span className={styles.statLabel}>Sources</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{Object.keys(brief.byTag).length}</span>
              <span className={styles.statLabel}>Categories</span>
            </div>
          </div>

          <section className={styles.briefsGrid}>
            {Object.entries(brief.byTag).map(([tag, items]) => (
              <Panel key={tag} title={tag.toUpperCase()}>
                <div className={styles.itemsList}>
                  {items.slice(0, 5).map((item: any) => (
                    <div key={item.hash} className={styles.briefItem}>
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.briefTitle}
                      >
                        {item.title}
                      </a>
                      <div className={styles.briefMeta}>
                        <span className={styles.source}>{item.source}</span>
                        <span className={styles.date}>
                          {new Date(item.pubDate).toLocaleDateString()}
                        </span>
                      </div>
                      {item.contentSnippet && (
                        <p className={styles.snippet}>{item.contentSnippet.slice(0, 150)}...</p>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className={styles.noItems}>No items in this category</p>
                  )}
                </div>
              </Panel>
            ))}
          </section>

          <div className={styles.actions}>
            <button 
              className={styles.downloadBtn}
              onClick={() => {
                const dataStr = JSON.stringify(brief, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `daily-brief-${brief.date}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            >
              📥 Download as JSON
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Generated at {new Date(brief.generatedAt).toLocaleString()}</p>
      </footer>
    </div>
  );
}
