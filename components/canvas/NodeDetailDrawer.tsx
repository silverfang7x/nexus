'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, GraphEdge, NodeType, AgentId } from '@/types/nexus';
import { getAgentColor } from './GraphNode';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NodeDetailDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AGENT_NAMES: Record<AgentId, string> = {
  advocate: 'Advocate',
  challenger: 'Challenger',
  factchecker: 'Fact-Checker',
  codeanalyst: 'Code Analyst',
  synthesizer: 'Synthesizer',
  orchestrator: 'Orchestrator',
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  claim: 'CLAIM',
  rebuttal: 'REBUTTAL',
  fact: 'FACT',
  source: 'SOURCE',
  file: 'FILE',
  issue: 'ISSUE',
  fix: 'FIX',
  feature: 'FEATURE',
  risk: 'RISK',
  milestone: 'MILESTONE',
  task: 'TASK',
};

function getConnectedNodes(nodeId: string, allNodes: GraphNode[], allEdges: GraphEdge[]): GraphNode[] {
  const connectedIds = new Set<string>();
  for (const edge of allEdges) {
    const src = typeof edge.source === 'object' && edge.source !== null && 'id' in edge.source
      ? (edge.source as { id: string }).id
      : edge.source as string;
    const tgt = typeof edge.target === 'object' && edge.target !== null && 'id' in edge.target
      ? (edge.target as { id: string }).id
      : edge.target as string;
    if (src === nodeId) connectedIds.add(tgt);
    if (tgt === nodeId) connectedIds.add(src);
  }
  return allNodes.filter((n) => connectedIds.has(n.id));
}

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  return `${Math.floor(diffM / 60)}h ago`;
}

// ─── Pill component ───────────────────────────────────────────────────────────

function ConnectedPill({
  node,
  onClick,
}: {
  node: GraphNode;
  onClick: () => void;
}) {
  const color = getAgentColor(node.agentId);
  const label = node.label.length > 16 ? node.label.slice(0, 13) + '...' : node.label;

  return (
    <button
      type="button"
      onClick={onClick}
      title={node.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 150ms, border-color 150ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          `color-mix(in srgb, ${color} 22%, transparent)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          `color-mix(in srgb, ${color} 10%, transparent)`;
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '10px',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

/**
 * Inner body — keyed by node.id so React resets all state
 * automatically when a different node is selected.
 */
function DrawerBody({
  node,
  onClose,
  allNodes,
  allEdges,
}: {
  node: GraphNode;
  onClose: () => void;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
}) {
  const [copied, setCopied] = useState(false);
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);

  // The "current" node shown is whichever pill was last clicked, or the original
  const displayNode = activeNode ?? node;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayNode.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [displayNode]);

  const handlePillClick = useCallback((connected: GraphNode) => {
    setActiveNode(connected);
    setCopied(false);
  }, []);

  const connected = getConnectedNodes(displayNode.id, allNodes, allEdges);
  const MAX_PILLS = 6;
  const visiblePills = connected.slice(0, MAX_PILLS);
  const overflowCount = connected.length - MAX_PILLS;

  return (
    <>
      {/* ── Drag handle ── */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px 0 6px',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            width: 40,
            height: 4,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.18)',
            display: 'block',
          }}
        />
      </button>

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* ── HEADER ROW ── */}
        <DrawerHeader
          displayNode={displayNode}
          onClose={onClose}
        />

        {/* ── MAIN CONTENT ── */}
        <DrawerContent displayNode={displayNode} />

        {/* ── CONNECTED NODES ── */}
        {visiblePills.length > 0 && (
          <div>
            <p
              style={{
                fontFamily: 'var(--nx-font-mono), monospace',
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'var(--nx-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Connected Nodes
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {visiblePills.map((conn) => (
                <ConnectedPill
                  key={conn.id}
                  node={conn}
                  onClick={() => handlePillClick(conn)}
                />
              ))}
              {overflowCount > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--nx-font-mono), monospace',
                    fontSize: '10px',
                    color: 'var(--nx-text-muted)',
                    padding: '4px 8px',
                    flexShrink: 0,
                    alignSelf: 'center',
                  }}
                >
                  +{overflowCount} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <DrawerFooter
        displayNode={displayNode}
        copied={copied}
        onCopy={handleCopy}
      />
    </>
  );
}

export default function NodeDetailDrawer({
  node,
  onClose,
  allNodes,
  allEdges,
}: NodeDetailDrawerProps) {
  return (
    <AnimatePresence>
      {node && (
        <>
          {/* Dark overlay */}
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#000',
              zIndex: 90,
            }}
          />

          {/* Drawer panel — keyed by node.id to reset DrawerBody state on selection change */}
          <motion.div
            key={`drawer-panel-${node.id}`}
            initial={{ y: 380 }}
            animate={{ y: 0 }}
            exit={{ y: 380 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: 380,
              zIndex: 95,
              backgroundColor: 'var(--nx-bg-elevated)',
              borderTop: '1px solid var(--nx-border)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <DrawerBody
              key={node.id}
              node={node}
              onClose={onClose}
              allNodes={allNodes}
              allEdges={allEdges}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DrawerHeader({
  displayNode,
  onClose,
}: {
  displayNode: GraphNode;
  onClose: () => void;
}) {
  const color = getAgentColor(displayNode.agentId);
  const agentName = AGENT_NAMES[displayNode.agentId] ?? displayNode.agentId;
  const typeLabel = NODE_TYPE_LABELS[displayNode.type] ?? displayNode.type.toUpperCase();
  const isFactChecker = displayNode.agentId === 'factchecker';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      {/* Agent badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--nx-font-mono), monospace',
            fontSize: '9px',
            color,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {agentName}
        </span>
      </span>

      {/* Node type label */}
      <span
        style={{
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '9px',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          borderLeft: '1px solid var(--nx-border)',
          paddingLeft: 10,
        }}
      >
        {typeLabel}
      </span>

      {/* Confidence bar (fact-checker only) */}
      {isFactChecker && displayNode.confidence !== undefined && (
        <div style={{ flex: 1, minWidth: 80 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--nx-font-mono), monospace',
                fontSize: '8px',
                color: 'var(--nx-text-muted)',
                letterSpacing: '0.1em',
              }}
            >
              CONFIDENCE
            </span>
            <span
              style={{
                fontFamily: 'var(--nx-font-mono), monospace',
                fontSize: '8px',
                color: 'var(--nx-factchecker)',
              }}
            >
              {Math.round(displayNode.confidence * 100)}%
            </span>
          </div>
          <div
            style={{
              height: 3,
              backgroundColor: 'rgba(255,255,255,0.07)',
              overflow: 'hidden',
              borderRadius: 0,
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${displayNode.confidence * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                backgroundColor: 'var(--nx-factchecker)',
              }}
            />
          </div>
        </div>
      )}

      {/* Spacer + close */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.35)',
          padding: '2px 4px',
          transition: 'color 150ms',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
        }}
      >
        ✕
      </button>
    </div>
  );
}

function DrawerContent({ displayNode }: { displayNode: GraphNode }) {
  // Detect URL in content (research / code mode)
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = displayNode.content.match(urlRegex);
  const firstUrl = urls?.[0];

  return (
    <div>
      {/* Node label — large */}
      <h3
        style={{
          fontFamily: 'var(--nx-font-sans, var(--nx-font-display)), sans-serif',
          fontWeight: 700,
          fontSize: '16px',
          color: '#ffffff',
          margin: '0 0 8px',
          lineHeight: 1.35,
          letterSpacing: '0.01em',
        }}
      >
        {displayNode.label}
      </h3>

      {/* Full content */}
      <p
        style={{
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '12px',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.65)',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}
      >
        {displayNode.content}
      </p>

      {/* URL link (research/code) */}
      {firstUrl && (
        <a
          href={firstUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 10,
            fontFamily: 'var(--nx-font-mono), monospace',
            fontSize: '10px',
            color: 'var(--nx-factchecker)',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(29,158,117,0.4)',
            wordBreak: 'break-all',
          }}
        >
          {firstUrl}
        </a>
      )}
    </div>
  );
}

function DrawerFooter({
  displayNode,
  copied,
  onCopy,
}: {
  displayNode: GraphNode;
  copied: boolean;
  onCopy: () => void;
}) {
  // Map agentId → mode for the mode badge
  const modeBadge: string = (() => {
    switch (displayNode.type) {
      case 'claim':
      case 'rebuttal': return 'DEBATE';
      case 'fact':
      case 'source': return 'RESEARCH';
      case 'file':
      case 'issue':
      case 'fix': return 'CODE';
      case 'feature':
      case 'risk':
      case 'milestone': return 'PLAN';
      default: return 'NEXUS';
    }
  })();

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid var(--nx-border)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      {/* Timestamp */}
      <span
        style={{
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '9px',
          color: 'var(--nx-text-muted)',
        }}
      >
        Generated {timeAgo(displayNode.timestamp)}
      </span>

      {/* Mode badge */}
      <span
        style={{
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '9px',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '2px 6px',
        }}
      >
        {modeBadge}
      </span>

      {/* Copy button */}
      <button
        type="button"
        onClick={onCopy}
        style={{
          fontFamily: 'var(--nx-font-mono), monospace',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          border: '1px solid rgba(255,255,255,0.2)',
          backgroundColor: 'transparent',
          color: copied ? '#1D9E75' : 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          transition: 'color 150ms, border-color 150ms',
          borderColor: copied ? 'rgba(29,158,117,0.5)' : 'rgba(255,255,255,0.2)',
        }}
        onMouseEnter={(e) => {
          if (!copied) (e.currentTarget as HTMLButtonElement).style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          if (!copied) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
        }}
      >
        {copied ? 'COPIED' : 'COPY'}
      </button>
    </div>
  );
}
