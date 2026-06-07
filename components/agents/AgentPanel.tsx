'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AgentId, AgentStatus } from '@/types/nexus';
import { getAgentColor } from '../canvas/GraphNode';

export interface AgentPanelProps {
  agentId: AgentId;
  status: AgentStatus;
  thoughts: string[]; // array of thought lines, newest last
  isActive: boolean;
}

/**
 * Maps AgentId to its specific hex color for box-shadow transparency manipulation.
 */
export function getAgentHexColor(agentId: AgentId): string {
  switch (agentId) {
    case 'advocate':
      return '#E8593C';
    case 'challenger':
      return '#E24B4A';
    case 'factchecker':
      return '#1D9E75';
    case 'codeanalyst':
      return '#378ADD';
    case 'synthesizer':
      return '#7F77DD';
    case 'orchestrator':
    default:
      return '#888780';
  }
}

export function getAgentName(agentId: AgentId): string {
  switch (agentId) {
    case 'advocate': return 'ADVOCATE';
    case 'challenger': return 'CHALLENGER';
    case 'factchecker': return 'FACT CHECKER';
    case 'codeanalyst': return 'CODE ANALYST';
    case 'synthesizer': return 'SYNTHESIZER';
    case 'orchestrator': return 'ORCHESTRATOR';
    default:
      return String(agentId).toUpperCase();
  }
}

export default function AgentPanel({
  agentId,
  status,
  thoughts,
  isActive
}: AgentPanelProps) {
  const agentColor = getAgentColor(agentId);
  const hexColor = getAgentHexColor(agentId);

  // Transition inset shadow when isActive is true
  const glowStyle = isActive
    ? { boxShadow: `inset 3px 0 8px ${hexColor}22` }
    : {};

  // Extract last 3 thoughts
  const displayThoughts = thoughts.slice(-3);

  const renderStatusBadge = () => {
    switch (status) {
      case 'idle':
        return (
          <span
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.3)'
            }}
          >
            IDLE
          </span>
        );
      case 'thinking':
        return (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '9px',
              color: agentColor
            }}
          >
            <span className="pulse-dot" style={{ backgroundColor: agentColor }} />
            THINKING
          </span>
        );
      case 'responding':
        return (
          <span
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '9px',
              color: agentColor
            }}
          >
            RESPONDING
            <span className="blinking-cursor">|</span>
          </span>
        );
      case 'done':
        return (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '9px',
              color: '#2dd4bf'
            }}
          >
            <svg
              className="w-2.5 h-2.5 mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            DONE
          </span>
        );
      case 'error':
        return (
          <span
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '9px',
              color: '#ffb4ab'
            }}
          >
            ERROR
          </span>
        );
      default:
        return null;
    }
  };

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
        ...glowStyle
      }}
    >
      {/* Styles for pulse dots and blinking cursor */}
      <style>{`
        @keyframes pulse-dot {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
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
          50% { opacity: 1; }
        }
        .blinking-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink-cursor 1s infinite step-end;
        }
      `}</style>

      {/* Header Row */}
      <div className="flex justify-between items-center mb-2.5">
        <span
          style={{
            fontFamily: 'var(--nx-font-display), sans-serif',
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: agentColor
          }}
        >
          {getAgentName(agentId)}
        </span>
        {renderStatusBadge()}
      </div>

      {/* Thought Stream Area */}
      <div
        style={{
          minHeight: '52px',
          maxHeight: '52px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        {displayThoughts.map((line, idx) => {
          const isLast = idx === displayThoughts.length - 1;
          const showCursor =
            isLast &&
            isActive &&
            (status === 'thinking' || status === 'responding');

          return (
            <div
              key={idx}
              style={{
                fontFamily: 'var(--nx-font-mono), monospace',
                fontSize: '10px',
                lineHeight: '1.6',
                color: isLast ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.45)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              &gt; {line}
              {showCursor && <span className="blinking-cursor">|</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface AgentPanelListProps {
  panels: Array<{
    agentId: AgentId;
    status: AgentStatus;
    thoughts: string[];
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
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    initial: {
      opacity: 0,
      x: -20
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as any // premium cubic-bezier ease out
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      {panels.map((panel, idx) => (
        <motion.div key={panel.agentId} variants={itemVariants}>
          <AgentPanel
            agentId={panel.agentId}
            status={panel.status}
            thoughts={panel.thoughts}
            isActive={panel.isActive}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}