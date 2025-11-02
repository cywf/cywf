'use client';

import React, { useState, useEffect } from 'react';
import { loadQOTD, type QOTDData } from '@/lib/utils/dataClient';
import styles from './QuoteOfTheDay.module.css';

export default function QuoteOfTheDay() {
  const [qotd, setQotd] = useState<QOTDData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQOTD()
      .then((data) => {
        setQotd(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load QOTD:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading quote...</div>
      </div>
    );
  }

  if (!qotd) {
    return null;
  }

  // Parse quote data based on source
  let quote = '';
  let author = '';

  if (qotd.source === 'zenquotes' && Array.isArray(qotd.data) && qotd.data.length > 0) {
    quote = qotd.data[0].q || qotd.data[0].quote || '';
    author = qotd.data[0].a || qotd.data[0].author || 'Unknown';
  } else if (qotd.source === 'quotable' && qotd.data) {
    quote = qotd.data.content || '';
    author = qotd.data.author || 'Unknown';
  }

  if (!quote) {
    return null;
  }

  return (
    <div className={styles.container}>
      <blockquote className={styles.quote}>
        <p className={styles.text}>"{quote}"</p>
        <footer className={styles.footer}>
          <cite className={styles.author}>— {author}</cite>
          <span className={styles.source}>
            via {qotd.source === 'zenquotes' ? 'ZenQuotes' : 'Quotable'}
          </span>
        </footer>
      </blockquote>
    </div>
  );
}
