'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NexusMode } from '@/types/nexus';

export interface ModeSelectorProps {
  activeMode: NexusMode;
  onModeChange: (mode: NexusMode) => void;
  onSubmit: (query: string, isContinuation?: boolean) => void;
  isRunning: boolean;
  /** If set, shows a "NEXUS suggests <mode>" banner */
  suggestedMode?: NexusMode | null;
  /** Called when user accepts the suggested mode */
  onAcceptSuggestion?: (mode: NexusMode) => void;
  query?: string;
  onQueryChange?: (query: string) => void;

  isContinuationReady?: boolean;
  nodeCount?: number;
  onClear?: () => void;
}

const placeholders: Record<NexusMode, string> = {
  debate: "Ask a contested question — AI regulation, remote work, UBI...",
  research: "Enter a research topic or paste a URL to analyse...",
  code: "Paste a GitHub repo URL — github.com/user/repo",
  plan: "Describe your app idea — be as vague or specific as you want..."
};

const MODE_LABELS: Record<NexusMode, string> = {
  debate: "DEBATE",
  research: "RESEARCH",
  code: "CODE",
  plan: "PLAN",
};

export default function ModeSelector({
  activeMode,
  onModeChange,
  onSubmit,
  isRunning,
  suggestedMode,
  onAcceptSuggestion,
  query: controlledQuery,
  onQueryChange,
  isContinuationReady = false,
  nodeCount = 0,
  onClear,
}: ModeSelectorProps) {
  const [localQuery, setLocalQuery] = useState('');
  const query = controlledQuery !== undefined ? controlledQuery : localQuery;
  const setQuery = onQueryChange !== undefined ? onQueryChange : setLocalQuery;

  const [isFocused, setIsFocused] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [hoveredNewSession, setHoveredNewSession] = useState(false);

  const modes: NexusMode[] = ['debate', 'research', 'code', 'plan'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isRunning) return;
    setBannerDismissed(false); // reset banner for next run
    onSubmit(query, isContinuationReady);
  };

  // Show the suggestion banner when:
  //  - suggestedMode is set and differs from activeMode
  //  - not dismissed by user
  const showBanner =
    !bannerDismissed &&
    !!suggestedMode &&
    suggestedMode !== activeMode;

  const placeholderText = isContinuationReady
    ? "Ask a follow-up... 'add payment system', 'make it mobile-first', 'what are the risks?'"
    : placeholders[activeMode];

  return (
    <div className="w-full bg-transparent">
      {/* Mode Tabs */}
      <div className="flex w-full flex-row">
        {modes.map((mode) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              type="button"
              disabled={isRunning}
              onClick={() => onModeChange(mode)}
              className="flex-1 cursor-pointer py-2.5 text-center uppercase transition-all duration-150 rounded-none border-0 focus:outline-none"
              style={{
                fontFamily: 'var(--nx-font-display), sans-serif',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
                borderBottom: isActive
                  ? '2px solid #ffffff'
                  : '1px solid var(--nx-border)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)';
              }}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* Mode suggestion banner */}
      <AnimatePresence>
        {showBanner && suggestedMode && (
          <motion.div
            key="suggestion-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              marginTop: 8,
              padding: '8px 10px',
              backgroundColor: 'rgba(127, 119, 221, 0.1)',
              border: '1px solid rgba(127, 119, 221, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--nx-font-mono), monospace',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: '#7F77DD', fontWeight: 700 }}>NEXUS</span>{' '}
              suggests{' '}
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {MODE_LABELS[suggestedMode]}
              </span>{' '}
              mode for this query
            </span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  onAcceptSuggestion?.(suggestedMode);
                  setBannerDismissed(true);
                }}
                style={{
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  border: '1px solid rgba(127, 119, 221, 0.6)',
                  backgroundColor: 'rgba(127, 119, 221, 0.15)',
                  color: '#7F77DD',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(127, 119, 221, 0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(127, 119, 221, 0.15)';
                }}
              >
                Switch
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                style={{
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: '9px',
                  padding: '3px 8px',
                  border: '1px solid var(--nx-border)',
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Keep
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="w-full flex flex-col">
        {/* Section Label */}
        <div
          className="uppercase select-none mb-2"
          style={{
            marginTop: '16px',
            fontFamily: 'var(--nx-font-mono), monospace',
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: 'rgba(255, 255, 255, 0.35)'
          }}
        >
          Query
        </div>

        {/* Small continuation banner above input */}
        {isContinuationReady && (
          <div
            style={{
              background: 'rgba(127, 119, 221, 0.08)',
              borderLeft: '2px solid var(--nx-synthesizer)',
              padding: '6px 10px',
              marginBottom: '8px',
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: 'var(--nx-synthesizer)',
            }}
          >
            ↳ SESSION ACTIVE — {nodeCount} nodes on canvas
          </div>
        )}

        {/* Textarea Area */}
        <div className="relative w-full">
          <textarea
            rows={3}
            value={query}
            disabled={isRunning}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full block resize-none p-2.5 rounded-none border outline-none transition-colors duration-150"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: isFocused ? 'var(--nx-border-hover)' : 'var(--nx-border)',
              color: 'var(--nx-text-primary)',
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '12px',
              lineHeight: '1.6'
            }}
          />

          {/* Animated Overlay Placeholder */}
          <AnimatePresence mode="wait">
            {!query && (
              <motion.div
                key={isContinuationReady ? 'continuation' : activeMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute"
                style={{
                  top: '11px',
                  left: '13px',
                  right: '13px',
                  color: 'rgba(255, 255, 255, 0.18)',
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: '12px',
                  lineHeight: '1.6'
                }}
              >
                {placeholderText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pulsing state CSS for button */}
        <style>{`
          @keyframes btn-pulse {
            0% { transform: scale(0.9); opacity: 0.4; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.4; }
          }
          .btn-pulse-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 8px;
            background-color: var(--nx-synthesizer);
            animation: btn-pulse 1.5s infinite ease-in-out;
          }
        `}</style>

        {/* Run Button / Continuation Buttons */}
        {!isContinuationReady ? (
          <button
            type="submit"
            disabled={isRunning || !query.trim()}
            className="w-full mt-2 py-2.5 select-none rounded-none cursor-pointer border transition-colors duration-150 uppercase flex items-center justify-center focus:outline-none"
            style={
              isRunning
                ? {
                    backgroundColor: 'transparent',
                    borderColor: 'var(--nx-synthesizer)',
                    color: 'var(--nx-synthesizer)',
                    fontFamily: 'var(--nx-font-display), sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    cursor: 'not-allowed'
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: '#ffffff',
                    fontFamily: 'var(--nx-font-display), sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    cursor: query.trim() ? 'pointer' : 'not-allowed',
                    opacity: query.trim() ? 1.0 : 0.5
                  }
            }
            onMouseEnter={(e) => {
              if (!isRunning && query.trim()) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#0A0A0F';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRunning) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
          >
            {isRunning ? (
              <>
                <span className="btn-pulse-dot" />
                Running...
              </>
            ) : (
              "Run Nexus"
            )}
          </button>
        ) : isRunning ? (
          <button
            type="button"
            disabled
            className="w-full mt-2 py-2.5 select-none rounded-none border transition-colors duration-150 uppercase flex items-center justify-center focus:outline-none"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--nx-synthesizer)',
              color: 'var(--nx-synthesizer)',
              fontFamily: 'var(--nx-font-display), sans-serif',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.12em',
              cursor: 'not-allowed'
            }}
          >
            <span className="btn-pulse-dot" />
            Running...
          </button>
        ) : (
          <div className="flex gap-2 mt-2 w-full">
            <button
              type="button"
              disabled={!query.trim()}
              onClick={() => {
                setBannerDismissed(false);
                onSubmit(query, true);
              }}
              className="py-2.5 select-none rounded-none transition-colors duration-150 uppercase flex items-center justify-center focus:outline-none"
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid var(--nx-synthesizer)',
                color: 'var(--nx-synthesizer)',
                fontFamily: 'var(--nx-font-display), sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.12em',
                cursor: query.trim() ? 'pointer' : 'not-allowed',
                opacity: query.trim() ? 1.0 : 0.5
              }}
              onMouseEnter={(e) => {
                if (query.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--nx-synthesizer)';
                  e.currentTarget.style.color = '#0A0A0F';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--nx-synthesizer)';
              }}
            >
              ↳ CONTINUE
            </button>
            <button
              type="button"
              disabled={!query.trim()}
              onClick={() => {
                setBannerDismissed(false);
                onClear?.();
                onSubmit(query, false);
              }}
              onMouseEnter={(e) => {
                setHoveredNewSession(true);
                if (query.trim()) {
                  e.currentTarget.style.borderColor = 'var(--nx-border-hover)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                setHoveredNewSession(false);
                e.currentTarget.style.borderColor = 'var(--nx-border)';
                e.currentTarget.style.color = 'var(--nx-text-muted)';
              }}
              title="This will clear the current graph"
              className="py-2.5 select-none rounded-none transition-colors duration-150 uppercase flex items-center justify-center focus:outline-none"
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid var(--nx-border)',
                color: 'var(--nx-text-muted)',
                fontFamily: 'var(--nx-font-display), sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.12em',
                cursor: query.trim() ? 'pointer' : 'not-allowed',
                opacity: query.trim() ? 1.0 : 0.5
              }}
            >
              NEW SESSION
            </button>
          </div>
        )}

        {hoveredNewSession && query.trim() && (
          <div
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '9px',
              color: '#E24B4A',
              textAlign: 'center',
              marginTop: '6px',
            }}
          >
            Warning: This will clear the current graph
          </div>
        )}

        {/* Hint footer text */}
        <div
          className="mt-2 text-center"
          style={{
            fontFamily: 'var(--nx-font-mono), monospace',
            fontSize: '9px',
            color: 'var(--nx-text-muted)'
          }}
        >
          {activeMode === 'code'
            ? "Supports public repos. Private repos coming soon."
            : "Agents will reason for 30–60 seconds."}
        </div>
      </form>
    </div>
  );
}