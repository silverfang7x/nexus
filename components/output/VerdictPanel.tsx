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
  issuesFound: CodeIssue[];
  suggestions: string[];
  verdict: string;
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
  const findings = data.findings ?? [];
  const contradictions = data.contradictions ?? [];

  return (
    <>
      <Section label="TLDR">
        <TldrValue text={data.tldr} />
      </Section>

      <Section label="FINDINGS">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {findings.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'var(--nx-surface)',
                border: '1px solid var(--nx-border)',
                padding: '8px 10px',
                borderRadius: '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: f.verified ? 'var(--nx-factchecker)' : '#DAA520',
                    flexShrink: 0,
                    marginTop: '6px',
                  }}
                />
                <span style={{ ...MONO, fontSize: '12px', color: 'var(--nx-text-secondary)', lineHeight: '1.7', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {f.claim}
                </span>
              </div>
              {f.source && (
                <div style={{ ...MONO, fontSize: '10px', color: 'var(--nx-text-muted)', paddingLeft: '14px', wordBreak: 'break-all' }}>
                  {f.source}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {contradictions.length > 0 && (
        <Section label="CONTRADICTIONS">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {contradictions.map((c, i) => (
              <ListItemRow key={i} isLast={i === contradictions.length - 1}>
                <span style={{ ...MONO, color: 'var(--nx-challenger)', flexShrink: 0 }}>✕</span>
                <span style={{ ...MONO, color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {c}
                </span>
              </ListItemRow>
            ))}
          </div>
        </Section>
      )}

      {data.consensus && (
        <Section label="CONSENSUS">
          <p
            style={{
              ...MONO,
              fontSize: '13px',
              fontStyle: 'italic',
              color: 'var(--nx-text-secondary)',
              lineHeight: '1.7',
              margin: 0,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {data.consensus}
          </p>
        </Section>
      )}

      <Section label="VERDICT" isLast={true}>
        <BodyText text={data.verdict} />
      </Section>
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
  const severityColor = (s: CodeIssue['severity']) => {
    if (s === 'high') return '#E24B4A';
    if (s === 'medium') return '#DAA520';
    return 'var(--nx-text-muted)';
  };

  const severityBg = (s: CodeIssue['severity']) => {
    if (s === 'high') return 'rgba(226, 75, 74, 0.15)';
    if (s === 'medium') return 'rgba(218, 165, 32, 0.15)';
    return 'rgba(255, 255, 255, 0.1)';
  };

  const severityBorder = (s: CodeIssue['severity']) => {
    if (s === 'high') return '1px solid #E24B4A';
    if (s === 'medium') return '1px solid #DAA520';
    return '1px solid transparent';
  };

  const issues = data.issuesFound ?? [];
  const suggestions = data.suggestions ?? [];

  return (
    <>
      <Section label="TLDR" extraLabelText={data.filesAnalysed ? `${data.filesAnalysed} files analysed` : undefined}>
        <TldrValue text={data.tldr} />
      </Section>

      {issues.length > 0 && (
        <Section label="ISSUES">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {issues.map((issue, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--nx-surface)',
                  border: '1px solid var(--nx-border)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      ...MONO,
                      fontSize: '7px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: severityColor(issue.severity),
                      background: severityBg(issue.severity),
                      border: severityBorder(issue.severity),
                      padding: '2px 5px',
                      borderRadius: '2px',
                    }}
                  >
                    {issue.severity}
                  </span>
                  <span style={{ ...MONO, fontSize: '11px', color: 'var(--nx-codeanalyst)', wordBreak: 'break-all' }}>
                    {issue.file}
                  </span>
                </div>
                <span style={{ ...MONO, fontSize: '12px', color: 'var(--nx-text-secondary)', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {issue.issue}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {suggestions.length > 0 && (
        <Section label="SUGGESTIONS">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {suggestions.map((s, i) => (
              <ListItemRow key={i} isLast={i === suggestions.length - 1}>
                <span style={{ ...MONO, fontWeight: 'bold', color: 'var(--nx-codeanalyst)', flexShrink: 0, minWidth: '16px' }}>
                  {i + 1}.
                </span>
                <span style={{ ...MONO, color: 'var(--nx-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {s}
                </span>
              </ListItemRow>
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
    try {
      return JSON.parse(verdict);
    } catch {
      return null;
    }
  }, [verdict]);

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