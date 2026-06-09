'use client';

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { NexusMode, GraphNode } from '@/types/nexus';
import { generateMarkdownExport } from '@/lib/exportMarkdown';

interface ExportButtonProps {
  mode: NexusMode;
  query: string;
  output: unknown;
  nodes: GraphNode[];
  disabled?: boolean;
}

export default function ExportButton({
  mode,
  query,
  output,
  nodes,
  disabled = false,
}: ExportButtonProps) {
  const [exportStatus, setExportStatus] = useState<'default' | 'exporting' | 'success'>('default');
  const [hovered, setHovered] = useState(false);

  // Reset success state after 2 seconds
  useEffect(() => {
    if (exportStatus === 'success') {
      const timer = setTimeout(() => {
        setExportStatus('default');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [exportStatus]);

  const handleExport = () => {
    if (disabled || !output || exportStatus === 'exporting') return;

    setExportStatus('exporting');

    // Slight delay for premium feel and showing exporting state
    setTimeout(() => {
      try {
        let structuredOutput = null;
        if (typeof output === 'string') {
          try {
            structuredOutput = JSON.parse(output);
          } catch (e) {
            console.warn('Failed to parse output JSON for structured markdown export', e);
            structuredOutput = output;
          }
        } else {
          structuredOutput = output;
        }

        const generatedSessionId = Math.random().toString(36).substring(2, 15);
        const date = new Date().toISOString().split('T')[0];
        const mdContent = generateMarkdownExport(
          mode,
          query,
          structuredOutput,
          nodes,
          generatedSessionId
        );

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus-${mode}-${date}-${generatedSessionId.slice(0, 6)}.md`;
        a.click();
        URL.revokeObjectURL(url);

        setExportStatus('success');
      } catch (error) {
        console.error('Error generating markdown export:', error);
        setExportStatus('default');
      }
    }, 600);
  };

  const isBtnDisabled = disabled || !output || exportStatus === 'exporting';

  const MONO: React.CSSProperties = { fontFamily: 'var(--nx-font-mono), monospace' };

  const getBackground = () => {
    if (isBtnDisabled) return 'rgba(255, 255, 255, 0.02)';
    if (exportStatus === 'success') return 'rgba(29, 158, 117, 0.1)';
    if (hovered) return 'rgba(255, 255, 255, 0.06)';
    return 'rgba(255, 255, 255, 0.02)';
  };

  const getBorderColor = () => {
    if (isBtnDisabled) return 'rgba(255, 255, 255, 0.05)';
    if (exportStatus === 'success') return 'var(--nx-factchecker)';
    return 'var(--nx-border)';
  };

  const getTextColor = () => {
    if (exportStatus === 'success') return 'var(--nx-factchecker)';
    return 'rgba(255, 255, 255, 0.8)';
  };

  const buttonStyle: React.CSSProperties = {
    ...MONO,
    fontSize: '9px',
    border: `1px solid ${getBorderColor()}`,
    background: getBackground(),
    padding: '4px 10px',
    borderRadius: 0,
    color: getTextColor(),
    cursor: isBtnDisabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 150ms',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    userSelect: 'none',
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isBtnDisabled}
      style={buttonStyle}
      onMouseEnter={() => !isBtnDisabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {exportStatus === 'exporting' && <span>EXPORTING...</span>}
      {exportStatus === 'success' && <span>EXPORTED ✓</span>}
      {exportStatus === 'default' && (
        <>
          <span>EXPORT .MD</span>
          <Download size={10} style={{ opacity: 0.8 }} />
        </>
      )}
    </button>
  );
}
