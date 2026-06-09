'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AgentId, AgentStatus } from '@/types/nexus';
import { getAgentColor } from '../canvas/GraphNode';

export interface AgentPanelProps {
  agentId: AgentId;
  status: AgentStatus;
  thoughts: string[];          // legacy array of thought lines (non-streaming fallback)
  streamingText?: string;      // accumulated streaming text, character by character
  isActive: boolean;
}

/**
 * Maps AgentId to its specific hex color for box-shadow transparency manipulation.
 */
export function getAgentHexColor(agentId: AgentId): string {
  switch (agentId) {
    case 'advocate':    return '#E8593C';
    case 'challenger':  return '#E24B4A';
    case 'factchecker': return '#1D9E75';
    case 'codeanalyst': return '#378ADD';
    case 'synthesizer': return '#7F77DD';
    case 'orchestrator':
    default:            return '#888780';
  }
}

export function getAgentName(agentId: AgentId): string {
  switch (agentId) {
    case 'advocate':    return 'ADVOCATE';
    case 'challenger':  return 'CHALLENGER';
    case 'factchecker': return 'FACT CHECKER';
    case 'codeanalyst': return 'CODE ANALYST';
    case 'synthesizer': return 'SYNTHESIZER';
    case 'orchestrator': return 'ORCHESTRATOR';
    default: return String(agentId).toUpperCase();
  }
}

/** Whether the status warrants an active blinking cursor */
function isCursorActive(status: AgentStatus): boolean {
  return status === 'streaming' || status === 'thinking' || status === 'responding';
}

export default function AgentPanel({
  agentId,
  status,
  thoughts,
  streamingText = '',
  isActive,
}: AgentPanelProps) {
  const agentColor = getAgentColor(agentId);
  const hexColor = getAgentHexColor(agentId);
  const thoughtRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as streaming tokens arrive
  useEffect(() => {
    if (thoughtRef.current) {
      thoughtRef.current.scrollTop = thoughtRef.current.scrollHeight;
    }
  }, [streamingText]);

  // Transition inset shadow when isActive
  const glowStyle = isActive
    ? { boxShadow: `inset 3px 0 8px ${hexColor}22` }
    : {};

  const renderStatusBadge = useCallback(() => {
    switch (status) {
      case 'idle':
        return (
          <span style={{ fontFamily: 'var(--nx-font-mono), monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
            IDLE
          </span>
        );
      case 'thinking':
        return (
          <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--nx-font-mono), monospace', fontSize: '9px', color: agentColor }}>
            <span className="pulse-dot" style={{ backgroundColor: agentColor }} />
            THINKING
          </span>
        );
      case 'streaming':
        return (
          <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--nx-font-mono), monospace', fontSize: '9px', color: agentColor }}>
            <span className="pulse-dot" style={{ backgroundColor: agentColor }} />
            STREAMING
          </span>
        );
      case 'responding':
        return (
          <span style={{ fontFamily: 'var(--nx-font-mono), monospace', fontSize: '9px', color: agentColor }}>
            RESPONDING
            <span className="blinking-cursor">|</span>
          </span>
        );
      case 'done':
        return (
          <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--nx-font-mono), monospace', fontSize: '9px', color: '#2dd4bf' }}>
            <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            DONE
          </span>
        );
      case 'error':
        return (
          <span style={{ fontFamily: 'var(--nx-font-mono), monospace', fontSize: '9px', color: '#ffb4ab' }}>
            ERROR
          </span>
        );
      default:
        return null;
    }
  }, [status, agentColor]);

  const showCursor = isCursorActive(status);

  // Decide what to display:
  // - If we have live streaming text, show it in the scroll container
  // - Otherwise fall back to the last 3 legacy thought lines
  const hasStreamingText = streamingText.length > 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--nx-bg-panel)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderLeft: `3px solid ${agentColor}`,
        borderTop: '1px solid var(--nx-border)',
        borderRight: '1px solid var(--nx-border)',
        borderBottom: '1px solid var(--nx-border)',
        padding: '10px 12px',
        fontFamily: 'var(--nx-font-display), sans-serif',
        transition: 'box-shadow 0.3s ease-in-out',
        minHeight: '80px',
        maxHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        ...glowStyle,
      }}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes pulse-dot {
          0%   { transform: scale(0.8); opacity: 0.5; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        .pulse-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse-dot 1.5s infinite ease-in-out;
        }

        @keyframes blink-cursor {
          0%, 100% { opacity: 0; }
          50%       { opacity: 1; }
        }
        .blinking-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink-cursor 1s infinite step-end;
        }

        @keyframes token-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .nx-stream-token {
          animation: token-fade 80ms ease-out forwards;
        }

        .nx-stream-scroll::-webkit-scrollbar {
          width: 2px;
        }
        .nx-stream-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .nx-stream-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 1px;
        }
      `}</style>

      {/* Header Row */}
      <div className="flex justify-between items-center mb-2.5">
        <span style={{ fontFamily: 'var(--nx-font-display), sans-serif', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: agentColor }}>
          {getAgentName(agentId)}
        </span>
        {renderStatusBadge()}
      </div>

      {/* Thought Stream Area */}
      {hasStreamingText ? (
        /* ── Live Streaming View ── */
        <div
          ref={thoughtRef}
          className="agent-thought-text"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: '140px',
            position: 'relative',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '10px',
              lineHeight: '1.65',
              color: 'rgba(255,255,255,0.78)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {streamingText}
            {/* Blinking cursor only while streaming — hides once done/complete */}
            {showCursor && <span className="blinking-cursor" style={{ color: agentColor }}>|</span>}
          </p>
        </div>
      ) : (
        /* ── Legacy Thought Lines (fallback) ── */
        <div
          style={{
            minHeight: '52px',
            maxHeight: '52px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {thoughts.slice(-3).map((line, idx, arr) => {
            const isLast = idx === arr.length - 1;
            return (
              <div
                key={idx}
                style={{
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: '10px',
                  lineHeight: '1.6',
                  color: isLast ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                &gt; {line}
                {isLast && showCursor && <span className="blinking-cursor">|</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface AgentPanelListProps {
  panels: Array<{
    agentId: AgentId;
    status: AgentStatus;
    thoughts: string[];
    streamingText?: string;
    isActive: boolean;
  }>;
}

/**
 * Parent container component that renders active panels using Framer Motion
 * with left-side sliding entrance animations and stagger effects.
 */
export function AgentPanelList({ panels }: AgentPanelListProps) {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-4">
      {panels.map((panel) => (
        <motion.div key={panel.agentId} variants={itemVariants}>
          <AgentPanel
            agentId={panel.agentId}
            status={panel.status}
            thoughts={panel.thoughts}
            streamingText={panel.streamingText}
            isActive={panel.isActive}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}