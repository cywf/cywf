'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './MermaidPanel.module.css';

// Mermaid diagram type presets
const DIAGRAM_PRESETS: Record<string, string> = {
  flowchart: `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
  
  mindmap: `mindmap
  root((CYWF))
    Projects
      FortiPath
      AegisNet
      Sentinel
    Skills
      Cybersecurity
      AI/ML
      Network Analysis
    Interests
      Space Systems
      Quantum Computing`,
  
  erDiagram: `erDiagram
    USER ||--o{ REPOSITORY : owns
    USER ||--o{ CONTRIBUTION : makes
    REPOSITORY ||--|{ COMMIT : contains
    CONTRIBUTION ||--|| COMMIT : creates
    
    USER {
        string login
        string name
        int stars
    }
    REPOSITORY {
        string name
        int stars
        string language
    }`,
  
  C4Context: `C4Context
    title System Context for CYWF Analytics

    Person(user, "Developer", "Views analytics and metrics")
    System(dashboard, "Analytics Dashboard", "Displays GitHub activity")
    System_Ext(github, "GitHub API", "Provides repository data")

    Rel(user, dashboard, "Views", "HTTPS")
    Rel(dashboard, github, "Fetches data", "GraphQL")`,
  
  C4Container: `C4Container
    title Container Diagram for Analytics Dashboard

    Person(user, "Developer")
    
    Container_Boundary(dashboard, "Analytics Dashboard") {
        Container(web, "Web App", "Next.js", "SPA")
        Container(data, "Data Layer", "JSON", "Static files")
    }
    
    System_Ext(github, "GitHub API")
    
    Rel(user, web, "Views")
    Rel(web, data, "Reads")
    Rel(data, github, "Fetches")`,
};

const DIAGRAM_TYPES = [
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'mindmap', label: 'Mind Map' },
  { value: 'erDiagram', label: 'ER Diagram' },
  { value: 'C4Context', label: 'C4 Context' },
  { value: 'C4Container', label: 'C4 Container' },
];

export default function MermaidPanel() {
  const [diagramType, setDiagramType] = useState('flowchart');
  const [source, setSource] = useState(DIAGRAM_PRESETS.flowchart);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const mermaidLoadedRef = useRef(false);

  // Load Mermaid from CDN
  useEffect(() => {
    if (mermaidLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.type = 'module';
    script.async = true;
    
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).mermaid) {
        (window as any).mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#2AFD7B',
            primaryTextColor: '#e7f7ee',
            primaryBorderColor: '#1FD96A',
            lineColor: '#3AFF81',
            secondaryColor: '#1FD96A',
            tertiaryColor: '#0a1111',
            background: '#0f1616',
            mainBkg: '#0f1616',
            secondBkg: '#0a1111',
            textColor: '#e7f7ee',
            fontSize: '14px',
          },
        });
        mermaidLoadedRef.current = true;
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setDiagramType(type);
    setSource(DIAGRAM_PRESETS[type] || '');
    setError(null);
  };

  const handleRender = async () => {
    if (!source.trim()) {
      setError('Please enter a diagram definition');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).mermaid && outputRef.current) {
        const mermaid = (window as any).mermaid;
        const id = `mermaid-${Date.now()}`;
        
        // Clear previous diagram
        outputRef.current.innerHTML = '';
        
        // Render new diagram
        const { svg } = await mermaid.render(id, source);
        outputRef.current.innerHTML = svg;
      } else {
        throw new Error('Mermaid library not loaded yet. Please wait a moment and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to render diagram');
      if (outputRef.current) {
        outputRef.current.innerHTML = '';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="diagram-type" className={styles.label}>
            Diagram Type:
          </label>
          <select
            id="diagram-type"
            value={diagramType}
            onChange={handleTypeChange}
            className={styles.select}
          >
            {DIAGRAM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRender}
          disabled={isLoading}
          className={styles.renderButton}
        >
          {isLoading ? 'Rendering...' : 'Render Diagram'}
        </button>
      </div>

      <div className={styles.editorSection}>
        <label htmlFor="diagram-source" className={styles.label}>
          Diagram Source:
        </label>
        <textarea
          id="diagram-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={styles.textarea}
          rows={10}
          placeholder="Enter Mermaid diagram syntax here..."
        />
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className={styles.outputSection}>
        <h3 className={styles.outputLabel}>Preview:</h3>
        <div ref={outputRef} className={styles.output} />
      </div>
    </div>
  );
}
