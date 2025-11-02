'use client';

import React, { useState, useEffect, useRef } from 'react';
import { loadGists, type GistsData } from '@/lib/utils/dataClient';
import styles from './GistsPanel.module.css';

export default function GistsPanel() {
  const [gists, setGists] = useState<GistsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGist, setSelectedGist] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    loadGists()
      .then((data) => {
        setGists(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load gists:', err);
        setLoading(false);
      });
  }, []);

  // Handle focus management when modal opens/closes
  useEffect(() => {
    if (showModal) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [showModal]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal && e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handlePreview = (gist: any) => {
    setSelectedGist(gist);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGist(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading gists...</div>
      </div>
    );
  }

  if (!gists || gists.items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No gists available</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gistsList}>
        {gists.items.map((gist, index) => (
          <div key={index} className={styles.gistCard}>
            <div className={styles.gistHeader}>
              <h3 className={styles.gistTitle}>
                {gist.name || 'Untitled Gist'}
              </h3>
              <span className={styles.gistDate}>
                {formatDate(gist.updatedAt)}
              </span>
            </div>
            {gist.description && (
              <p className={styles.gistDescription}>
                {gist.description}
              </p>
            )}
            <div className={styles.gistActions}>
              <button
                onClick={() => handlePreview(gist)}
                className={styles.previewButton}
                disabled={!gist.preview}
              >
                Preview
              </button>
              <a
                href={gist.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.githubLink}
              >
                Open in GitHub →
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedGist && (
        <div 
          className={styles.modal}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            ref={modalRef}
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className={styles.modalHeader}>
              <h2 id="modal-title" className={styles.modalTitle}>
                {selectedGist.name || 'Untitled Gist'}
              </h2>
              <button
                onClick={closeModal}
                className={styles.closeButton}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedGist.preview ? (
                <pre className={styles.preview}>
                  <code>{selectedGist.preview}</code>
                </pre>
              ) : (
                <p className={styles.noPreview}>
                  No preview available. Please{' '}
                  <a href={selectedGist.url} target="_blank" rel="noopener noreferrer">
                    open in GitHub
                  </a>{' '}
                  to view the full content.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <a
                href={selectedGist.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalGithubLink}
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
