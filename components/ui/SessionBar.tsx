'use client';

import React from 'react';
import { NexusMode } from '@/types/nexus';
import { NexusSession } from '@/lib/sessionStorage';

interface SessionBarProps {
  sessions: NexusSession[];
  activeSessionId: string | null;
  onRestoreSession: (session: NexusSession) => void;
  currentMode: NexusMode;
  isRunning: boolean;
}

export function getModeColor(mode: NexusMode): string {
  switch (mode) {
    case 'debate': return '#E24B4A';
    case 'research': return '#1D9E75';
    case 'code': return '#378ADD';
    case 'plan': return '#BA7517';
    default: return 'rgba(255,255,255,0.4)';
  }
}

export default function SessionBar({
  sessions,
  activeSessionId,
  onRestoreSession,
  currentMode,
  isRunning
}: SessionBarProps) {
  
  const truncateQuery = (query: string): string => {
    if (query.length > 20) {
      return query.substring(0, 17) + '...';
    }
    return query;
  };

  return (
    <div
      style={{
        height: 36,
        background: 'var(--nx-bg)',
        borderBottom: '1px solid var(--nx-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box',
        width: '100%',
        zIndex: 40,
      }}
    >
      <style>{`
        @keyframes session-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .session-pulsing {
          animation: session-pulse 1.5s infinite ease-in-out;
        }
        .session-pill {
          transition: all 150ms ease;
        }
        .session-pill:hover {
          border-color: var(--nx-border-hover) !important;
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>

      {/* LEFT SIDE: Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--nx-font-display), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.15em',
            color: 'var(--nx-text-primary)',
            userSelect: 'none',
            textTransform: 'uppercase',
          }}
        >
          NEXUS
        </span>
      </div>

      {/* CENTER: Session pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexGrow: 1,
          justifyContent: 'center',
        }}
      >
        {sessions.length === 0 ? (
          <span
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: 9,
              color: 'var(--nx-text-muted)',
              letterSpacing: '0.05em',
            }}
          >
            — NO SESSIONS YET —
          </span>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const modeColor = getModeColor(session.mode);
            
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onRestoreSession(session)}
                className="session-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--nx-bg-elevated)',
                  border: `1px solid ${isActive ? modeColor : 'var(--nx-border)'}`,
                  padding: '4px 10px',
                  borderRadius: 0,
                  cursor: 'pointer',
                  color: isActive ? '#ffffff' : 'var(--nx-text-muted)',
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: 10,
                  boxShadow: isActive ? `0 0 4px ${modeColor}33` : 'none',
                  outline: 'none',
                }}
              >
                <span>SESSION {session.id}</span>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: modeColor,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: 9, opacity: 0.75 }}>
                  {truncateQuery(session.query)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* RIGHT SIDE: Current Mode & Status Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: 10,
        }}
      >
        {/* Current Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: getModeColor(currentMode),
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--nx-text-muted)', textTransform: 'uppercase' }}>
            {currentMode}
          </span>
        </div>

        {/* Live Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className={isRunning ? 'session-pulsing' : undefined}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isRunning ? '#1D9E75' : '#888780',
              boxShadow: isRunning ? '0 0 6px #1D9E75' : 'none',
              display: 'inline-block',
            }}
          />
          <span style={{ color: isRunning ? '#ffffff' : 'var(--nx-text-muted)', fontWeight: isRunning ? 600 : 400 }}>
            {isRunning ? 'LIVE' : 'READY'}
          </span>
        </div>
      </div>
    </div>
  );
}
