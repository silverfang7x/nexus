import React, { useState } from 'react';
import { NexusMode } from '@/types/nexus';

export interface VerdictPanelProps {
  verdict: string;
  mode: NexusMode;
  nodeCount: number;
  edgeCount: number;
  isRunning: boolean;
}

const getModeColor = (mode: NexusMode): string => {
  switch (mode) {
    case 'debate': return '#E24B4A';
    case 'research': return '#1D9E75';
    case 'code': return '#378ADD';
    case 'plan': return '#BA7517';
    default: return 'var(--nx-text-muted)';
  }
};

function renderHighlightedText(text: string) {
  const regex = /(\[[^\]]+\]|"[^"]+")/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span key={index} style={{ color: 'var(--nx-synthesizer)' }}>
          {part}
        </span>
      );
    } else if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <span 
          key={index} 
          style={{ 
            color: 'rgba(255, 255, 255, 0.55)', 
            fontStyle: 'italic' 
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function VerdictPanel({
  verdict,
  mode,
  nodeCount,
  edgeCount,
  isRunning
}: VerdictPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!verdict) return;
    navigator.clipboard.writeText(verdict).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const actionButtonStyle = {
    fontFamily: 'var(--nx-font-mono), monospace',
    fontSize: '9px',
    border: '1px solid var(--nx-border)',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '4px 10px',
    borderRadius: 0,
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 150ms'
  };

  // 1. Loading State
  if (isRunning && !verdict) {
    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          backgroundColor: 'transparent'
        }}
      >
        <div className="label-xs mb-4">OUTPUT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div 
            style={{
              height: '12px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'nx-shimmer 1.5s infinite',
              width: '100%'
            }}
          />
          <div 
            style={{
              height: '12px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'nx-shimmer 1.5s infinite',
              width: '90%'
            }}
          />
          <div 
            style={{
              height: '8px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'nx-shimmer 1.5s infinite',
              width: '60%'
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Empty State (not running, no verdict)
  if (!verdict) {
    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          backgroundColor: 'transparent'
        }}
      >
        <div className="label-xs mb-4">OUTPUT</div>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span 
            style={{ 
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '11px',
              color: 'var(--nx-text-muted)'
            }}
          >
            Awaiting synthesis...
          </span>
        </div>
      </div>
    );
  }

  // 3. Has verdict content
  const paragraphs = verdict.split(/\n\n+/).filter(Boolean);

  return (
    <div 
      style={{
        padding: '16px',
        overflowY: 'auto',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Top metadata row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span 
          className="label-xs" 
          style={{ color: getModeColor(mode), fontWeight: 700 }}
        >
          {mode.toUpperCase()}
        </span>
        <span className="label-xs" style={{ color: 'var(--nx-text-muted)' }}>
          {nodeCount} nodes · {edgeCount} edges
        </span>
      </div>

      {/* Verdict text area */}
      <div style={{ flexGrow: 1 }}>
        {paragraphs.map((para, index) => (
          <p
            key={index}
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '12px',
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.75)',
              borderLeft: index === 0 ? '2px solid var(--nx-synthesizer)' : undefined,
              paddingLeft: index === 0 ? '12px' : undefined,
              marginBottom: index === 0 ? '20px' : '16px'
            }}
          >
            {renderHighlightedText(para)}
          </p>
        ))}
      </div>

      {/* Bottom action row */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--nx-border)', paddingTop: '16px' }}>
        <button 
          type="button" 
          onClick={handleCopy} 
          style={actionButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          }}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <button 
          type="button" 
          onClick={() => console.log('export')} 
          style={actionButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          }}
        >
          EXPORT
        </button>
      </div>
    </div>
  );
}