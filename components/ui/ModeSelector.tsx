'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NexusMode } from '@/types/nexus';

export interface ModeSelectorProps {
  activeMode: NexusMode;
  onModeChange: (mode: NexusMode) => void;
  onSubmit: (query: string) => void;
  isRunning: boolean;
}

const placeholders: Record<NexusMode, string> = {
  debate: "Ask a contested question — AI regulation, remote work, UBI...",
  research: "Enter a research topic or paste a URL to analyse...",
  code: "Paste a GitHub repo URL — github.com/user/repo",
  plan: "Describe your app idea — be as vague or specific as you want..."
};

export default function ModeSelector({
  activeMode,
  onModeChange,
  onSubmit,
  isRunning
}: ModeSelectorProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const modes: NexusMode[] = ['debate', 'research', 'code', 'plan'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isRunning) return;
    onSubmit(query);
  };

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
                key={activeMode}
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
                {placeholders[activeMode]}
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

        {/* Run Button */}
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