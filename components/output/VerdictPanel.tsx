'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { NexusMode, GraphNode, GraphEdge } from '@/types/nexus';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerdictPanelProps {
  output: unknown;
  mode: NexusMode;
  nodeCount?: number;
  edgeCount?: number;
  isRunning?: boolean;
  query?: string;
  nodes?: GraphNode[];
  session?: {
    query: string;
    mode: NexusMode;
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  hasRun?: boolean;
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
  overallScore: number;
  issuesFound: CodeIssue[];
  suggestions: unknown[];
  verdict: string;
}

function parseResearchVerdict(text: string) {
  try {
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function parseCodeVerdict(text: string) {
  try {
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── Styling constants ────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: 'var(--nx-font-mono), monospace' };
const PLAN_COLOR = 'var(--nx-plan-color, #DAA520)';

const MUTED_LABEL: React.CSSProperties = {
  ...MONO,
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--nx-text-muted)',
  marginBottom: 6,
};

// ─── Shared sub-components ────────────────────────────────────────────────────

interface SectionProps {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
  labelColor?: string;
  extraLabelText?: string;
}

function Section({ label, children, isLast = false, labelColor, extraLabelText }: SectionProps) {
  return (
    <div
      style={{
        marginBottom: '20px',
        paddingBottom: isLast ? '0' : '20px',
        borderBottom: isLast ? 'none' : '1px solid var(--nx-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <p
          style={{
            ...MONO,
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: labelColor || 'var(--nx-text-muted)',
            margin: 0,
          }}
        >
          {label}
        </p>
        {extraLabelText && (
          <span style={{ ...MONO, fontSize: '9px', color: 'var(--nx-text-muted)' }}>
            {extraLabelText}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function TldrValue({ text }: { text: string }) {
  return (
    <p
      style={{
        ...MONO,
        fontSize: '15px',
        fontWeight: 500,
        color: 'var(--nx-synthesizer)',
        lineHeight: 1.4,
        margin: 0,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      }}
    >
      {text}
    </p>
  );
}

function BodyText({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        ...MONO,
        fontSize: '12px',
        color: 'var(--nx-text-secondary)',
        lineHeight: '1.7',
        margin: 0,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        ...style,
      }}
    >
      {text}
    </p>
  );
}

interface ListItemRowProps {
  children: React.ReactNode;
  isLast?: boolean;
  hoverBg?: string;
  bg?: string;
}

function ListItemRow({ children, isLast = false, hoverBg, bg }: ListItemRowProps) {
  const [hovered, setHovered] = useState(false);
  const hasBackground = bg || (hovered && hoverBg);
  return (
    <div
      onMouseEnter={() => hoverBg && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: hasBackground ? '5px 8px' : '5px 0',
        fontSize: '12px',
        lineHeight: 1.5,
        fontFamily: 'var(--nx-font-mono), monospace',
        borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
        background: hovered && hoverBg ? hoverBg : (bg || 'transparent'),
        transition: 'background 150ms',
      }}
    >
      {children}
    </div>
  );
}

// ─── Mode-specific renderers ──────────────────────────────────────────────────

function DebateView({ data }: { data: DebateOutput }) {
  const confidence = Math.min(Math.max(data.confidence ?? 0, 0), 1);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidth(confidence * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidence]);

  const forPoints = data.for ?? [];
  const againstPoints = data.against ?? [];

  return (
    <>
      <Section label="TLDR">
        <TldrValue text={data.tldr} />
      </Section>

      <Section label="FOR" labelColor="var(--nx-advocate)">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {forPoints.map((point, i) => (
            <ListItemRow key={i} isLast={i === forPoints.length - 1} hoverBg="rgba(232, 89, 60, 0.04)">
              <span style={{ ...MONO, color: 'var(--nx-advocate)', flexShrink: 0 }}>→</span>
              <span style={{ ...MONO, color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {point}
              </span>
            </ListItemRow>
          ))}
        </div>
      </Section>

      <Section label="AGAINST" labelColor="var(--nx-challenger)">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {againstPoints.map((point, i) => (
            <ListItemRow key={i} isLast={i === againstPoints.length - 1}>
              <span style={{ ...MONO, color: 'var(--nx-challenger)', flexShrink: 0 }}>→</span>
              <span style={{ ...MONO, color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {point}
              </span>
            </ListItemRow>
          ))}
        </div>
      </Section>

      <Section label="VERDICT" isLast={confidence === undefined || confidence === null}>
        <div
          style={{
            borderLeft: '2px solid var(--nx-synthesizer)',
            paddingLeft: '10px',
          }}
        >
          <BodyText text={data.verdict} style={{ fontSize: '13px', color: 'var(--nx-text-primary)' }} />
        </div>
      </Section>

      {confidence !== undefined && confidence !== null && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p
              style={{
                ...MONO,
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--nx-text-muted)',
                margin: 0,
              }}
            >
              CONFIDENCE
            </p>
            <span style={{ ...MONO, fontSize: '9px', color: 'var(--nx-synthesizer)', fontWeight: 600 }}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div style={{ height: '2px', background: 'var(--nx-border)', width: '100%', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${barWidth}%`,
                background: 'var(--nx-synthesizer)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ResearchView({ data }: { data: ResearchOutput }) {
  return (
    <div>
      {/* TLDR */}
      <div style={{ marginBottom: 16 }}>
        <p className="label-xs" style={{ marginBottom: 6 }}>
          TLDR
        </p>
        <p style={{
          fontFamily: 'var(--nx-font-display)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--nx-factchecker)',
          lineHeight: 1.4
        }}>
          {data.tldr}
        </p>
      </div>

      {/* Findings */}
      <div style={{ marginBottom: 16 }}>
        <p className="label-xs" style={{ marginBottom: 8 }}>
          FINDINGS
        </p>
        {data.findings?.map((f: ResearchFinding, i: number) => (
          <div key={i} style={{
            padding: '8px 10px',
            marginBottom: 6,
            background: 'rgba(255,255,255,0.03)',
            borderLeft: `2px solid ${f.verified 
              ? 'var(--nx-factchecker)' 
              : 'var(--nx-challenger)'}`,
          }}>
            <p style={{
              fontFamily: 'var(--nx-font-mono)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
              margin: '0 0 4px'
            }}>
              {f.claim}
            </p>
            <div style={{ display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' }}>
              <span style={{
                fontFamily: 'var(--nx-font-mono)',
                fontSize: 9,
                color: 'var(--nx-text-muted)',
                letterSpacing: '0.06em'
              }}>
                SOURCE: {f.source}
              </span>
              <span style={{
                fontFamily: 'var(--nx-font-mono)',
                fontSize: 9,
                color: f.verified 
                  ? 'var(--nx-factchecker)' 
                  : 'var(--nx-challenger)',
                letterSpacing: '0.06em'
              }}>
                {f.verified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Consensus */}
      {data.consensus && (
        <div style={{ marginBottom: 16 }}>
          <p className="label-xs" style={{ marginBottom: 6 }}>
            CONSENSUS
          </p>
          <p style={{
            fontFamily: 'var(--nx-font-mono)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.7,
            borderLeft: '2px solid var(--nx-synthesizer)',
            paddingLeft: 10
          }}>
            {data.consensus}
          </p>
        </div>
      )}

      {/* Contradictions */}
      {data.contradictions && data.contradictions.length > 0 && (
        <div>
          <p className="label-xs" style={{ marginBottom: 6 }}>
            OPEN QUESTIONS
          </p>
          {data.contradictions.map((c: string, i: number) => (
            <p key={i} style={{
              fontFamily: 'var(--nx-font-mono)',
              fontSize: 10,
              color: 'var(--nx-text-secondary)',
              padding: '3px 0',
              display: 'flex',
              gap: 6
            }}>
              <span style={{ color: 'var(--nx-challenger)' }}>?</span>
              {c}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanView({ data }: { data: PlanOutput }) {
  const stackEntries: { label: string; key: keyof PlanOutput['stack'] }[] = [
    { label: 'FRONTEND', key: 'frontend' },
    { label: 'BACKEND', key: 'backend' },
    { label: 'DATABASE', key: 'database' },
    { label: 'HOSTING', key: 'hosting' },
  ];

  const features = data.features ?? [];
  const risks = data.risks ?? [];
  const timeline = data.timeline ?? [];

  return (
    <>
      <Section label="TLDR">
        <TldrValue text={data.tldr} />
      </Section>

      {data.problem && (
        <Section label="PROBLEM">
          <div
            style={{
              borderLeft: `2px solid ${PLAN_COLOR}`,
              paddingLeft: '10px',
            }}
          >
            <BodyText text={data.problem} />
          </div>
        </Section>
      )}

      {data.stack && (
        <Section label="TECH STACK">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {stackEntries.map(({ label, key }) => (
              <div
                key={key}
                style={{
                  border: '1px solid var(--nx-border)',
                  padding: '10px 12px',
                  background: 'var(--nx-surface)',
                }}
              >
                <div style={{ ...MONO, fontSize: '9px', color: 'var(--nx-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ ...MONO, fontSize: '14px', color: 'var(--nx-text-primary)', fontWeight: 600 }}>
                  {data.stack[key] || '—'}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {features.length > 0 && (
        <Section label="FEATURES">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {features.map((f, i) => (
              <ListItemRow key={i} isLast={i === features.length - 1}>
                <span style={{ ...MONO, fontWeight: 'bold', color: PLAN_COLOR, flexShrink: 0, minWidth: '16px' }}>
                  {i + 1}.
                </span>
                <span style={{ ...MONO, color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {f}
                </span>
              </ListItemRow>
            ))}
          </div>
        </Section>
      )}

      {risks.length > 0 && (
        <Section label="RISKS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {risks.map((r, i) => (
              <ListItemRow key={i} isLast={i === risks.length - 1} bg="rgba(218, 165, 32, 0.05)">
                <span style={{ color: PLAN_COLOR, flexShrink: 0 }}>⚠</span>
                <span style={{ ...MONO, color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {r}
                </span>
              </ListItemRow>
            ))}
          </div>
        </Section>
      )}

      {timeline.length > 0 && (
        <Section label="TIMELINE">
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '12px', paddingTop: '8px' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute',
              left: '22px',
              top: '20px',
              bottom: '20px',
              width: '1px',
              borderLeft: '1px solid var(--nx-border)',
              zIndex: 0,
            }} />
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: i === timeline.length - 1 ? 0 : '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `1px solid ${PLAN_COLOR}`,
                  background: 'var(--nx-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ ...MONO, fontSize: '8px', color: PLAN_COLOR, fontWeight: 'bold' }}>W{t.week}</span>
                </div>
                <span style={{ ...MONO, fontSize: '11px', color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {t.milestone}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="VERDICT" isLast={true}>
        <BodyText text={data.verdict} />
      </Section>
    </>
  );
}

function CodeView({ data }: { data: CodeOutput }) {
  return (
    <div>
      {/* Score + TLDR row */}
      <div style={{ 
        display: 'flex', gap: 12, 
        alignItems: 'flex-start', 
        marginBottom: 16 
      }}>
        <div style={{
          width: 52, height: 52, flexShrink: 0,
          border: `2px solid ${
            data.overallScore >= 8 
              ? 'var(--nx-factchecker)' 
              : data.overallScore >= 5 
              ? '#BA7517' 
              : 'var(--nx-challenger)'
          }`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{
            fontFamily: 'var(--nx-font-display)',
            fontSize: 20, fontWeight: 800,
            color: 'white'
          }}>
            {data.overallScore}
          </span>
          <span style={{
            fontFamily: 'var(--nx-font-mono)',
            fontSize: 8, color: 'var(--nx-text-muted)',
            letterSpacing: '0.06em'
          }}>
            /10
          </span>
        </div>
        <div>
          <p className="label-xs" style={{ marginBottom: 4 }}>
            TLDR
          </p>
          <p style={{
            fontFamily: 'var(--nx-font-display)',
            fontSize: 13, fontWeight: 600,
            color: 'var(--nx-codeanalyst)',
            lineHeight: 1.4
          }}>
            {data.tldr}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ 
        display: 'flex', gap: 16, 
        marginBottom: 16,
        padding: '8px 0',
        borderTop: '1px solid var(--nx-border)',
        borderBottom: '1px solid var(--nx-border)'
      }}>
        {[
          { label: 'FILES', value: data.filesAnalysed },
          { label: 'ISSUES', value: data.issuesFound?.length || 0 },
          { label: 'FIXES', value: data.suggestions?.length || 0 },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--nx-font-display)',
              fontSize: 20, fontWeight: 700,
              color: 'white', margin: 0
            }}>
              {stat.value}
            </p>
            <p className="label-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Issues by severity */}
      <p className="label-xs" style={{ marginBottom: 8 }}>
        ISSUES FOUND
      </p>
      {['high', 'medium', 'low'].map(severity => {
        const issues = data.issuesFound?.filter(
          (i: CodeIssue) => i.severity === severity
        ) || []
        if (issues.length === 0) return null
        return (
          <div key={severity} style={{ marginBottom: 10 }}>
            <span style={{
              fontFamily: 'var(--nx-font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: severity === 'high' 
                ? 'var(--nx-challenger)'
                : severity === 'medium' 
                ? '#BA7517' 
                : 'var(--nx-text-muted)',
              display: 'block',
              marginBottom: 4
            }}>
              {severity} severity ({issues.length})
            </span>
            {issues.slice(0, 3).map((issue: CodeIssue, i: number) => (
              <div key={i} style={{
                padding: '5px 8px',
                marginBottom: 3,
                background: 'rgba(255,255,255,0.02)',
                borderLeft: `1px solid ${
                  severity === 'high' 
                    ? 'var(--nx-challenger)' 
                    : 'var(--nx-border)'
                }`
              }}>
                <p style={{
                  fontFamily: 'var(--nx-font-mono)',
                  fontSize: 10,
                  color: 'var(--nx-text-muted)',
                  margin: '0 0 2px',
                  letterSpacing: '0.04em'
                }}>
                  {issue.file}
                </p>
                <p style={{
                  fontFamily: 'var(--nx-font-mono)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.75)',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {issue.issue}
                </p>
              </div>
            ))}
            {issues.length > 3 && (
              <p style={{
                fontFamily: 'var(--nx-font-mono)',
                fontSize: 9,
                color: 'var(--nx-text-muted)',
                margin: '2px 0 0 8px'
              }}>
                +{issues.length - 3} more issues
              </p>
            )}
          </div>
        )
      })}
    </div>
  );
}

// ─── Fallback: raw text ───────────────────────────────────────────────────────

function RawTextView({ verdict }: { verdict: string }) {
  const isJson = verdict.trim().startsWith('{') || verdict.trim().startsWith('[');
  
  if (isJson) {
    return (
      <pre
        style={{
          ...MONO,
          fontSize: '11px',
          lineHeight: '1.6',
          color: 'rgba(255,255,255,0.7)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowX: 'hidden',
          margin: 0,
        }}
      >
        {verdict}
      </pre>
    );
  }

  const paragraphs = verdict.split(/\n\n|\n(?=[A-Z])/).filter(Boolean);
  return (
    <div style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
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
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
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
  output,
  mode,
  nodeCount = 0,
  edgeCount = 0,
  isRunning = false,
}: VerdictPanelProps) {
  const verdict = typeof output === 'string' ? output : (output ? JSON.stringify(output) : '');

  // Parse JSON at the top — MUST be before any early returns to obey Rules of Hooks
  const parsed = useMemo(() => {
    if (!verdict) return null;
    if (mode === 'research') return parseResearchVerdict(verdict);
    if (mode === 'code') return parseCodeVerdict(verdict);
    try {
      return JSON.parse(verdict);
    } catch {
      return null;
    }
  }, [verdict, mode]);

  // ── 1. Loading state ──────────────────────────────────────────────────────
  if (isRunning && !verdict) {
    return (
      <div style={{ width: '100%', padding: 16 }}>
        <div style={{ ...MUTED_LABEL, marginBottom: 12 }}>OUTPUT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-line" style={{ width: '100%' }} />
          <div className="skeleton-line" style={{ width: '90%' }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  // ── 2. Empty state ────────────────────────────────────────────────────────
  if (!verdict) {
    const hints: Record<NexusMode, string> = {
      debate: 'Enter any question or controversial topic',
      research: 'Enter a topic to research and synthesise',
      code: 'Paste a public GitHub repository URL',
      plan: 'Describe an app or project idea',
    };

    return (
      <div style={{ width: '100%', padding: 16 }}>
        <div style={{ ...MUTED_LABEL, marginBottom: 12 }}>OUTPUT</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, textAlign: 'center' }}>
          {/* 2x2 Dots Grid Icon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: '4px', marginBottom: '16px' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--nx-text-muted)',
                }}
              />
            ))}
          </div>
          <span style={{ ...MONO, fontSize: '11px', color: 'var(--nx-text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Run a query to see {mode.toUpperCase()} output
          </span>
          <span style={{ ...MONO, fontSize: '10px', color: 'var(--nx-text-muted)', opacity: 0.7 }}>
            {hints[mode]}
          </span>
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
    <div
      className="verdict-panel"
      style={{
        padding: 16,
        width: '100%',
      }}
    >
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
      <div>
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
    </div>
  );
}