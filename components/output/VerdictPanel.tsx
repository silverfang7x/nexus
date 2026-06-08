'use client';

import React, { useState, useMemo } from 'react';
import { NexusMode } from '@/types/nexus';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerdictPanelProps {
  verdict: string;
  mode: NexusMode;
  nodeCount: number;
  edgeCount: number;
  isRunning: boolean;
}

interface DebateOutput {
  tldr: string;
  for: string[];
  against: string[];
  verdict: string;
  confidence: number;
}

interface ResearchFinding {
  claim: string;
  source: string;
  verified: boolean;
}

interface ResearchOutput {
  tldr: string;
  findings: ResearchFinding[];
  consensus: string;
  contradictions: string[];
  verdict: string;
}

interface PlanOutput {
  tldr: string;
  problem: string;
  stack: { frontend: string; backend: string; database: string; hosting: string };
  features: string[];
  risks: string[];
  timeline: { week: number; milestone: string }[];
  verdict: string;
}

interface CodeIssue {
  file: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

interface CodeOutput {
  tldr: string;
  filesAnalysed: number;
  issuesFound: CodeIssue[];
  suggestions: string[];
  verdict: string;
}

// ─── Styling constants ────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: 'var(--nx-font-mono), monospace' };
const MUTED_LABEL: React.CSSProperties = {
  ...MONO,
  fontSize: '9px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--nx-text-muted)',
  marginBottom: 6,
};
const SECTION: React.CSSProperties = { marginBottom: 20 };

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={MUTED_LABEL}>{children}</p>;
}

function TldrBlock({ text }: { text: string }) {
  return (
    <div style={{ ...SECTION, borderLeft: '2px solid var(--nx-synthesizer)', paddingLeft: 10 }}>
      <SectionLabel>TLDR</SectionLabel>
      <p style={{ ...MONO, fontSize: 14, color: 'var(--nx-synthesizer)', lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

function VerdictBlock({ text }: { text: string }) {
  return (
    <div style={SECTION}>
      <SectionLabel>VERDICT</SectionLabel>
      <p style={{ ...MONO, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

// ─── Mode-specific renderers ──────────────────────────────────────────────────

function DebateView({ data }: { data: DebateOutput }) {
  const confidence = Math.min(Math.max(data.confidence ?? 0, 0), 1);
  return (
    <>
      <TldrBlock text={data.tldr} />

      {/* FOR */}
      <div style={SECTION}>
        <SectionLabel>FOR</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(data.for ?? []).map((point, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--nx-advocate)', flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--nx-advocate)', lineHeight: 1.55 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AGAINST */}
      <div style={SECTION}>
        <SectionLabel>AGAINST</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(data.against ?? []).map((point, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--nx-challenger)', flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--nx-challenger)', lineHeight: 1.55 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>

      <VerdictBlock text={data.verdict} />

      {/* Confidence bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <SectionLabel>CONFIDENCE</SectionLabel>
          <span style={{ ...MONO, fontSize: 9, color: 'var(--nx-synthesizer)' }}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${confidence * 100}%`,
              background: 'var(--nx-synthesizer)',
              transition: 'width 0.6s ease-out',
            }}
          />
        </div>
      </div>
    </>
  );
}

function ResearchView({ data }: { data: ResearchOutput }) {
  return (
    <>
      <TldrBlock text={data.tldr} />

      {/* FINDINGS */}
      <div style={SECTION}>
        <SectionLabel>FINDINGS</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data.findings ?? []).map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: f.verified ? 'var(--nx-factchecker)' : '#D4A017',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55 }}>
                  {f.claim}
                </span>
                {f.source && (
                  <div style={{ ...MONO, fontSize: 9, color: 'var(--nx-text-muted)', marginTop: 2 }}>
                    {f.source}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTRADICTIONS */}
      {(data.contradictions ?? []).length > 0 && (
        <div style={SECTION}>
          <SectionLabel>CONTRADICTIONS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.contradictions.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ ...MONO, fontSize: 11, color: '#E24B4A', flexShrink: 0, marginTop: 1 }}>✗</span>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONSENSUS */}
      {data.consensus && (
        <div style={SECTION}>
          <SectionLabel>CONSENSUS</SectionLabel>
          <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
            {data.consensus}
          </p>
        </div>
      )}

      <VerdictBlock text={data.verdict} />
    </>
  );
}

function PlanView({ data }: { data: PlanOutput }) {
  const stackEntries: { label: string; key: keyof PlanOutput['stack'] }[] = [
    { label: 'FRONTEND', key: 'frontend' },
    { label: 'BACKEND', key: 'backend' },
    { label: 'DATABASE', key: 'database' },
    { label: 'HOSTING', key: 'hosting' },
  ];

  return (
    <>
      <TldrBlock text={data.tldr} />

      {/* PROBLEM */}
      {data.problem && (
        <div style={SECTION}>
          <SectionLabel>PROBLEM</SectionLabel>
          <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
            {data.problem}
          </p>
        </div>
      )}

      {/* STACK GRID */}
      {data.stack && (
        <div style={SECTION}>
          <SectionLabel>TECH STACK</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {stackEntries.map(({ label, key }) => (
              <div
                key={key}
                style={{
                  border: '1px solid var(--nx-border)',
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ ...MONO, fontSize: 8, color: 'var(--nx-text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ ...MONO, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  {data.stack[key] || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEATURES */}
      {(data.features ?? []).length > 0 && (
        <div style={SECTION}>
          <SectionLabel>FEATURES</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ ...MONO, fontSize: 10, color: 'var(--nx-synthesizer)', flexShrink: 0, minWidth: 16 }}>
                  {i + 1}.
                </span>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RISKS */}
      {(data.risks ?? []).length > 0 && (
        <div style={SECTION}>
          <SectionLabel>RISKS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.risks.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {(data.timeline ?? []).length > 0 && (
        <div style={{ ...SECTION }}>
          <SectionLabel>TIMELINE</SectionLabel>
          <div style={{ position: 'relative', paddingTop: 8, paddingBottom: 24 }}>
            {/* Connector line */}
            <div
              style={{
                position: 'absolute',
                top: 19,
                left: 12,
                right: 12,
                height: 1,
                background: 'rgba(255,255,255,0.1)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              {data.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {/* Week node dot */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '1px solid var(--nx-synthesizer)',
                      background: 'var(--nx-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ ...MONO, fontSize: 8, color: 'var(--nx-synthesizer)' }}>W{t.week}</span>
                  </div>
                  {/* Milestone label */}
                  <span
                    style={{
                      ...MONO,
                      fontSize: 8,
                      color: 'rgba(255,255,255,0.55)',
                      textAlign: 'center',
                      lineHeight: 1.4,
                      maxWidth: 70,
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.milestone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <VerdictBlock text={data.verdict} />
    </>
  );
}

function CodeView({ data }: { data: CodeOutput }) {
  const severityColor = (s: CodeIssue['severity']) => {
    if (s === 'high') return '#E24B4A';
    if (s === 'medium') return '#D4A017';
    return 'rgba(255,255,255,0.35)';
  };

  return (
    <>
      <TldrBlock text={data.tldr} />

      {/* Files analysed stat */}
      {data.filesAnalysed != null && (
        <div style={{ ...SECTION, display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: 9, color: 'var(--nx-text-muted)' }}>FILES ANALYSED</span>
          <span style={{ ...MONO, fontSize: 22, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
            {data.filesAnalysed}
          </span>
        </div>
      )}

      {/* ISSUES TABLE */}
      {(data.issuesFound ?? []).length > 0 && (
        <div style={SECTION}>
          <SectionLabel>ISSUES FOUND</SectionLabel>
          <div style={{ border: '1px solid var(--nx-border)', overflow: 'hidden' }}>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 72px',
                padding: '6px 10px',
                borderBottom: '1px solid var(--nx-border)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              {['FILE', 'ISSUE', 'SEVERITY'].map((h) => (
                <span key={h} style={{ ...MONO, fontSize: 8, color: 'var(--nx-text-muted)', letterSpacing: '0.1em' }}>
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {data.issuesFound.map((issue, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 72px',
                  padding: '7px 10px',
                  borderBottom: i < data.issuesFound.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    ...MONO,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    wordBreak: 'break-all',
                    paddingRight: 6,
                  }}
                >
                  {issue.file}
                </span>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
                  {issue.issue}
                </span>
                <span
                  style={{
                    ...MONO,
                    fontSize: 9,
                    color: severityColor(issue.severity),
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUGGESTIONS */}
      {(data.suggestions ?? []).length > 0 && (
        <div style={SECTION}>
          <SectionLabel>SUGGESTIONS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ ...MONO, fontSize: 10, color: 'var(--nx-synthesizer)', flexShrink: 0, minWidth: 16 }}>
                  {i + 1}.
                </span>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <VerdictBlock text={data.verdict} />
    </>
  );
}

// ─── Fallback: raw text ───────────────────────────────────────────────────────

function RawTextView({ verdict }: { verdict: string }) {
  const paragraphs = verdict.split(/\n\n|\n(?=[A-Z])/).filter(Boolean);
  return (
    <div>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          style={{
            ...MONO,
            fontSize: 12,
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.75)',
            borderLeft: i === 0 ? '2px solid var(--nx-synthesizer)' : undefined,
            paddingLeft: i === 0 ? 12 : undefined,
            marginBottom: i === 0 ? 20 : 16,
          }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VerdictPanel({
  verdict,
  mode,
  nodeCount,
  edgeCount,
  isRunning,
}: VerdictPanelProps) {
  const [copied, setCopied] = useState(false);

  // Parse JSON at the top — MUST be before any early returns to obey Rules of Hooks
  const parsed = useMemo(() => {
    if (!verdict) return null;
    try {
      return JSON.parse(verdict);
    } catch {
      return null;
    }
  }, [verdict]);

  const handleCopy = () => {
    if (!verdict) return;
    navigator.clipboard.writeText(verdict).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const actionButtonStyle: React.CSSProperties = {
    ...MONO,
    fontSize: '9px',
    border: '1px solid var(--nx-border)',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '4px 10px',
    borderRadius: 0,
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 150ms',
  };

  // ── 1. Loading state ──────────────────────────────────────────────────────
  if (isRunning && !verdict) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}>
        <div className="label-xs mb-4">OUTPUT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[100, 90, 60].map((w, i) => (
            <div
              key={i}
              style={{
                height: i === 2 ? 8 : 12,
                width: `${w}%`,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                backgroundSize: '200% 100%',
                animation: 'nx-shimmer 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── 2. Empty state ────────────────────────────────────────────────────────
  if (!verdict) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}>
        <div className="label-xs mb-4">OUTPUT</div>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...MONO, fontSize: 11, color: 'var(--nx-text-muted)' }}>Awaiting synthesis...</span>
        </div>
      </div>
    );
  }

  // ── 3. Has verdict content ────────────────────────────────────────────────
  const modeColor =
    mode === 'debate' ? '#E24B4A' :
    mode === 'research' ? '#1D9E75' :
    mode === 'code' ? '#378ADD' :
    '#BA7517';

  return (
    <div style={{ padding: 16, overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top metadata row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="label-xs" style={{ color: modeColor, fontWeight: 700 }}>
          {mode.toUpperCase()}
        </span>
        <span className="label-xs" style={{ color: 'var(--nx-text-muted)' }}>
          {nodeCount} nodes · {edgeCount} edges
        </span>
      </div>

      {/* Structured or raw content */}
      <div style={{ flexGrow: 1 }}>
        {parsed ? (
          <>
            {mode === 'debate' && <DebateView data={parsed as DebateOutput} />}
            {mode === 'research' && <ResearchView data={parsed as ResearchOutput} />}
            {mode === 'plan' && <PlanView data={parsed as PlanOutput} />}
            {mode === 'code' && <CodeView data={parsed as CodeOutput} />}
            {/* If mode doesn't match any renderer, fall back to raw */}
            {!['debate', 'research', 'plan', 'code'].includes(mode) && (
              <RawTextView verdict={verdict} />
            )}
          </>
        ) : (
          <RawTextView verdict={verdict} />
        )}
      </div>

      {/* Bottom action row */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
          borderTop: '1px solid var(--nx-border)',
          paddingTop: 16,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          style={actionButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([verdict], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexus-${mode}-output.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={actionButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        >
          EXPORT
        </button>
      </div>
    </div>
  );
}