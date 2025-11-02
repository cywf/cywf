'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getHTML } from '@/lib/utils/dataClient';
import styles from './DailyBrief.module.css';

export default function DailyBrief() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentType, setContentType] = useState<'html' | 'md' | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Try to load HTML first, then fallback to MD
    getHTML('/data/daily-brief.html')
      .then((html) => {
        setContent(html);
        setContentType('html');
        setLoading(false);
      })
      .catch(() => {
        // Try markdown
        getHTML('/data/daily-brief.md')
          .then((md) => {
            setContent(md);
            setContentType('md');
            setLoading(false);
            // Load marked and DOMPurify from CDN
            loadMarkdownLibraries();
          })
          .catch((err) => {
            console.error('Failed to load daily brief:', err);
            setLoading(false);
          });
      });
  }, []);

  // NOTE: For production use, consider using SRI (Subresource Integrity) hashes
  // or bundling these libraries locally to prevent supply chain attacks.
  // Current approach prioritizes bundle-free setup as per requirements.
  const loadMarkdownLibraries = () => {
    // Load marked
    if (!(window as any).marked) {
      const markedScript = document.createElement('script');
      markedScript.src = 'https://cdn.jsdelivr.net/npm/marked@11/marked.min.js';
      markedScript.async = true;
      document.head.appendChild(markedScript);
    }

    // Load DOMPurify
    if (!(window as any).DOMPurify) {
      const purifyScript = document.createElement('script');
      purifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js';
      purifyScript.async = true;
      document.head.appendChild(purifyScript);
    }
  };

  useEffect(() => {
    if (contentType === 'md' && content && contentRef.current) {
      // Wait for libraries to load
      const interval = setInterval(() => {
        if ((window as any).marked && (window as any).DOMPurify) {
          clearInterval(interval);
          const marked = (window as any).marked;
          const DOMPurify = (window as any).DOMPurify;
          
          try {
            const html = marked.parse(content);
            const clean = DOMPurify.sanitize(html, {
              ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'br', 'hr', 'blockquote',
                'ul', 'ol', 'li',
                'strong', 'em', 'code', 'pre',
                'a', 'img',
                'table', 'thead', 'tbody', 'tr', 'th', 'td'
              ],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
            });
            if (contentRef.current) {
              contentRef.current.innerHTML = clean;
            }
          } catch (err) {
            console.error('Failed to parse markdown:', err);
          }
        }
      }, 100);

      return () => clearInterval(interval);
    } else if (contentType === 'html' && content && contentRef.current) {
      // Sanitize HTML
      if ((window as any).DOMPurify) {
        const DOMPurify = (window as any).DOMPurify;
        const clean = DOMPurify.sanitize(content);
        contentRef.current.innerHTML = clean;
      } else {
        // Load DOMPurify if not available
        loadMarkdownLibraries();
        const interval = setInterval(() => {
          if ((window as any).DOMPurify && contentRef.current) {
            clearInterval(interval);
            const DOMPurify = (window as any).DOMPurify;
            const clean = DOMPurify.sanitize(content);
            contentRef.current.innerHTML = clean;
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [content, contentType]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading daily brief...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No daily brief available</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Daily Brief</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleButton}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse brief' : 'Expand brief'}
        >
          {isExpanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>
      
      {isExpanded && (
        <div 
          ref={contentRef}
          className={styles.content}
        />
      )}
    </div>
  );
}
