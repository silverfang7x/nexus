'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearSessions } from '@/lib/sessionStorage';
import { NexusMode, NexusSession } from '@/types/nexus';

interface SessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: NexusSession[];
  onRestoreSession: (session: NexusSession) => void;
  currentSessionId: string | null;
  onClearAll: () => void;
  onNewSession: () => void;
}

function getModeColor(mode: NexusMode): string {
  switch (mode) {
    case 'debate': return '#E24B4A';
    case 'research': return '#1D9E75';
    case 'code': return '#378ADD';
    case 'plan': return 'var(--nx-plan-color, #DAA520)';
    default: return 'rgba(255,255,255,0.4)';
  }
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  return new Date(timestamp).toLocaleDateString();
}

const MONO: React.CSSProperties = { fontFamily: 'var(--nx-font-mono), monospace' };

export default function SessionsDrawer({
  isOpen,
  onClose,
  sessions,
  onRestoreSession,
  currentSessionId,
  onClearAll,
  onNewSession,
}: SessionsDrawerProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [newSessionHovered, setNewSessionHovered] = useState(false);

  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const handleClearAll = () => {
    if (confirmClear) {
      clearSessions();
      onClearAll();
      onClose();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 49,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* DRAWER SLIDE PANEL */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '320px',
              backgroundColor: 'var(--nx-bg)',
              borderRight: '1px solid var(--nx-border)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '24px 0 48px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* HEADER ROW */}
            <div
              style={{
                height: '56px',
                minHeight: '56px',
                padding: '0 20px',
                borderBottom: '1px solid var(--nx-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  ...MONO,
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--nx-text-muted)',
                }}
              >
                SESSION HISTORY
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  ...MONO,
                  fontSize: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--nx-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--nx-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--nx-text-muted)')}
              >
                ✕
              </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
              }}
              className="nx-thin-scroll"
            >
              {/* NEW SESSION BUTTON */}
              <button
                type="button"
                onClick={() => {
                  onNewSession();
                }}
                onMouseEnter={() => setNewSessionHovered(true)}
                onMouseLeave={() => setNewSessionHovered(false)}
                style={{
                  width: '100%',
                  height: '40px',
                  background: newSessionHovered ? 'rgba(127, 119, 221, 0.05)' : 'transparent',
                  border: '1px solid var(--nx-border)',
                  borderColor: newSessionHovered ? 'var(--nx-synthesizer)' : 'var(--nx-border)',
                  color: newSessionHovered ? 'var(--nx-synthesizer)' : 'var(--nx-text-primary)',
                  fontFamily: '"DM Mono", var(--nx-font-mono), monospace',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
                NEW SESSION
              </button>

              <div
                style={{
                  borderBottom: '1px solid var(--nx-border)',
                  margin: '12px 0',
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  ...MONO,
                  fontSize: '9px',
                  color: 'var(--nx-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                  flexShrink: 0,
                }}
              >
                HISTORY
              </div>

              {sessions.length === 0 ? (
                /* EMPTY STATE */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* CSS Clock Icon */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '1.5px solid var(--nx-text-muted)',
                      position: 'relative',
                      marginBottom: '12px',
                      opacity: 0.5,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '1px',
                        height: '6px',
                        background: 'var(--nx-text-muted)',
                        transform: 'translate(-50%, -100%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '5px',
                        height: '1.5px',
                        background: 'var(--nx-text-muted)',
                        transform: 'translate(0, -50%)',
                      }}
                    />
                  </div>
                  <p
                    style={{
                      ...MONO,
                      fontSize: '11px',
                      color: 'var(--nx-text-muted)',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    No sessions yet
                  </p>
                  <p
                    style={{
                      ...MONO,
                      fontSize: '10px',
                      color: 'var(--nx-text-muted)',
                      opacity: 0.7,
                      lineHeight: 1.4,
                    }}
                  >
                    Run a query to create your first session
                  </p>
                </div>
              ) : (
                /* SESSIONS LIST */
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {sessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    const primaryModeColor = getModeColor(session.primaryMode);

                    const modesList: NexusMode[] = ['debate', 'research', 'code', 'plan'];
                    const nonNullModes = modesList.filter(
                      (m) => session.modes[m] !== null
                    );
                    const modeCount = nonNullModes.length;
                    const totalNodes = nonNullModes.reduce((sum, m) => sum + (session.modes[m]?.nodes.length || 0), 0);

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          onRestoreSession(session);
                          onClose();
                        }}
                        style={{
                          background: 'var(--nx-surface)',
                          border: '1px solid var(--nx-border)',
                          borderLeft: `3px solid ${primaryModeColor}`,
                          padding: '12px 14px',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 150ms ease',
                          borderColor: isActive ? 'var(--nx-border-active)' : 'var(--nx-border)',
                          boxShadow: isActive ? `inset 0 0 8px rgba(255,255,255,0.02)` : 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--nx-border-hover)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isActive ? 'var(--nx-border-active)' : 'var(--nx-border)';
                          e.currentTarget.style.background = 'var(--nx-surface)';
                        }}
                      >
                        {/* Top row label + badge */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              ...MONO,
                              fontSize: '9px',
                              color: 'var(--nx-text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            SESSION {session.id}
                          </span>
                          {/* Mode Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: primaryModeColor,
                                display: 'inline-block',
                              }}
                            />
                            <span
                              style={{
                                ...MONO,
                                fontSize: '8px',
                                color: 'var(--nx-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {session.primaryMode}
                            </span>
                          </div>
                        </div>

                        {/* Query text */}
                        <p
                          style={{
                            ...MONO,
                            fontSize: '12px',
                            color: 'var(--nx-text-primary)',
                            margin: 0,
                            lineHeight: 1.4,
                            wordBreak: 'break-all',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {session.primaryQuery}
                        </p>

                        {/* Mode dots row */}
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', margin: '2px 0' }}>
                          {modesList.map((mode) => {
                            const hasData = session.modes[mode] !== null;
                            const modeColor = getModeColor(mode);
                            return (
                              <span
                                key={mode}
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: hasData ? modeColor : 'transparent',
                                  border: hasData ? `1px solid ${modeColor}` : '1px solid var(--nx-border)',
                                  boxSizing: 'border-box',
                                  display: 'inline-block',
                                }}
                                title={`${mode}: ${hasData ? 'explored' : 'not explored'}`}
                              />
                            );
                          })}
                        </div>

                        {/* Meta row */}
                        <span
                          style={{
                            ...MONO,
                            fontSize: '10px',
                            color: 'var(--nx-text-muted)',
                          }}
                        >
                          {formatRelativeTime(session.timestamp)} · {modeCount} {modeCount === 1 ? 'mode' : 'modes'} · {totalNodes} nodes
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER */}
            {sessions.length > 0 && (
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--nx-border)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    ...MONO,
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    background: 'none',
                    border: 'none',
                    color: confirmClear ? 'var(--nx-challenger)' : 'var(--nx-text-muted)',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!confirmClear) e.currentTarget.style.color = 'var(--nx-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!confirmClear) e.currentTarget.style.color = 'var(--nx-text-muted)';
                  }}
                >
                  {confirmClear ? 'CONFIRM CLEAR' : 'CLEAR ALL'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
