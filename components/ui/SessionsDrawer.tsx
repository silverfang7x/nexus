'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedSession } from '@/types/nexus';

interface SessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSession: (session: SavedSession) => void;
  currentSessionId: string | null;
  onClearAll: () => void;
  onNewSession: () => void;
}



function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  return new Date(timestamp).toLocaleDateString();
}

const MONO: React.CSSProperties = { fontFamily: 'var(--nx-font-mono), monospace' };

export default function SessionsDrawer({
  isOpen,
  onClose,
  onRestoreSession,
  currentSessionId,
  onClearAll,
  onNewSession,
}: SessionsDrawerProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [newSessionHovered, setNewSessionHovered] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('nx-sessions') || '[]'
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessions(saved);
    } catch {
      setSessions([]);
    }
  }, []);

  // Also refresh when drawer opens:
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(
          localStorage.getItem('nx-sessions') || '[]'
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessions(saved);
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const handleClearAll = () => {
    if (confirmClear) {
      try {
        localStorage.removeItem('nx-sessions');
      } catch (e) {
        console.warn('Clear sessions failed:', e);
      }
      setSessions([]);
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
                <div style={{ 
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  flex: 1, gap: 8, opacity: 0.5
                }}>
                  <span style={{ fontSize: 20 }}>◎</span>
                  <p style={{
                    fontFamily: 'var(--nx-font-mono)',
                    fontSize: 11, color: 'var(--nx-text-muted)',
                    textAlign: 'center'
                  }}>
                    No sessions yet
                    <br/>Run a query to create your first session
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onRestoreSession(session);
                        onClose();
                      }}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--nx-bg-panel, var(--nx-surface))',
                        border: session.id === currentSessionId 
                          ? '1px solid var(--nx-synthesizer)' 
                          : '1px solid var(--nx-border)',
                        cursor: 'pointer',
                        transition: 'border-color 150ms'
                      }}
                      onMouseEnter={e => 
                        e.currentTarget.style.borderColor = 
                          'var(--nx-border-hover)'
                      }
                      onMouseLeave={e =>
                        e.currentTarget.style.borderColor = 
                          session.id === currentSessionId 
                            ? 'var(--nx-synthesizer)' 
                            : 'var(--nx-border)'
                      }
                    >
                      {/* Mode badge + time */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4
                      }}>
                        <span style={{
                          fontFamily: 'var(--nx-font-mono)',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: {
                            debate: 'var(--nx-challenger)',
                            research: 'var(--nx-factchecker)',
                            code: 'var(--nx-codeanalyst)',
                            plan: 'var(--nx-synthesizer)'
                          }[session.mode]
                        }}>
                          {session.mode}
                        </span>
                        <span style={{
                          fontFamily: 'var(--nx-font-mono)',
                          fontSize: 9,
                          color: 'var(--nx-text-muted)'
                        }}>
                          {getRelativeTime(session.timestamp)}
                        </span>
                      </div>
                      
                      {/* TLDR */}
                      <p style={{
                        fontFamily: 'var(--nx-font-display)',
                        fontSize: 12, fontWeight: 500,
                        color: 'rgba(255,255,255,0.85)',
                        margin: '0 0 4px',
                        lineHeight: 1.4
                      }}>
                        {session.tldr.slice(0, 55)}
                        {session.tldr.length > 55 ? '...' : ''}
                      </p>
                      
                      {/* Stats */}
                      <p style={{
                        fontFamily: 'var(--nx-font-mono)',
                        fontSize: 9,
                        color: 'var(--nx-text-muted)',
                        margin: 0
                      }}>
                        {session.nodeCount} nodes · {session.edgeCount} edges
                      </p>
                    </div>
                  ))}
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
