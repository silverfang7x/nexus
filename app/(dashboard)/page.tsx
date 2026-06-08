'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NexusGraph from '@/components/canvas/NexusGraph';
import AgentPanel from '@/components/agents/AgentPanel';
import ModeSelector from '@/components/ui/ModeSelector';
import VerdictPanel from '@/components/output/VerdictPanel';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useGraph } from '@/hooks/useGraph';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AgentId, AgentStatus, NexusMode, GraphNode } from '@/types/nexus';
import { getAgentColor } from '@/components/canvas/GraphNode';
import NodeDetailDrawer from '@/components/canvas/NodeDetailDrawer';

// ─── constants ───────────────────────────────────────────────────────────────

const CORE_AGENTS: AgentId[] = [
  'advocate',
  'challenger',
  'factchecker',
  'codeanalyst',
  'synthesizer',
];

const MODE_AGENTS: Record<NexusMode, AgentId[]> = {
  debate: ['advocate', 'challenger', 'factchecker', 'synthesizer'],
  research: ['factchecker', 'synthesizer'],
  code: ['codeanalyst', 'synthesizer'],
  plan: ['advocate', 'factchecker', 'synthesizer'],
};

const SHEET_SPRING = { type: 'spring', damping: 28, stiffness: 300 } as const;

// ─── sub-components ──────────────────────────────────────────────────────────

/** Centered pill drag-handle */
function DragHandle() {
  return (
    <div
      style={{
        width: 32,
        height: 4,
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.2)',
        margin: '8px auto',
        flexShrink: 0,
      }}
    />
  );
}

/** Frosted-glass bottom sheet */
function BottomSheet({
  open,
  onClose,
  height,
  children,
}: {
  open: boolean;
  onClose: () => void;
  height: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={SHEET_SPRING}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height,
            zIndex: 55,
            backgroundColor: 'var(--nx-bg-elevated)',
            borderTop: '1px solid var(--nx-border)',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle — tap to dismiss */}
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <DragHandle />
          </button>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Full-screen backdrop; tap → close active sheet */
function Backdrop({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── FAB button ──────────────────────────────────────────────────────────────

function FAB({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--nx-font-display), sans-serif',
        fontWeight: 700,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '10px 20px',
        borderRadius: 0,
        border: `1px solid ${active ? '#ffffff' : 'var(--nx-border)'}`,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'border-color 150ms',
      }}
    >
      {label}
    </button>
  );
}

// ─── main dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { query, nodes, edges, events, status, verdict, activeAgents, processedQuery, agentThoughts, startSession } =
    useAgentStream();

  useGraph(nodes, edges);

  const isMobile = useMediaQuery('(max-width: 767px)');

  const [activeMode, setActiveMode] = useState<NexusMode>('debate');
  const [timeString, setTimeString] = useState('');
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const closeAll = useCallback(() => {
    setAgentsOpen(false);
    setOutputOpen(false);
  }, []);

  // Lock body scroll while a sheet is open on mobile
  useEffect(() => {
    if (isMobile && (agentsOpen || outputOpen)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, agentsOpen, outputOpen]);

  // Enforce full-viewport sizing
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const next = document.getElementById('__next');

    html.style.height = '100vh';
    html.style.overflow = 'hidden';
    body.style.height = '100vh';
    body.style.overflow = 'hidden';
    if (next) {
      next.style.height = '100vh';
      next.style.overflow = 'hidden';
    }

    return () => {
      html.style.height = '';
      html.style.overflow = '';
      body.style.height = '';
      body.style.overflow = '';
    };
  }, []);

  // Live clock
  useEffect(() => {
    const tick = () =>
      setTimeString(new Date().toLocaleTimeString([], { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleQuerySubmit = useCallback(
    (query: string) => {
      const isMock = query.includes('--mock');
      startSession(activeMode, query.replace('--mock', '').trim(), isMock);
    },
    [activeMode, startSession]
  );

  // Build panel data from live event stream
  const panelsData = CORE_AGENTS.map((agentId) => {
    const isActive = activeAgents.includes(agentId);
    const agentEvents = events.filter((e) => e.agentId === agentId);
    // Legacy thoughts array for compatibility (non-streaming fallback)
    const thoughts = agentEvents
      .map((e) => e.payload.text ?? '')
      .filter(Boolean);

    // Streaming text accumulated character-by-character
    const streamingText = agentThoughts[agentId] ?? '';

    // Has this agent received any streaming tokens in this session?
    const hasStreaming = agentEvents.some((e) => e.type === 'streaming');
    const isStreamingNow = isActive && hasStreaming && agentEvents.some((e) => e.type === 'streaming') &&
      !agentEvents.some((e) => e.type === 'complete' || e.type === 'done');

    let agentStatus: AgentStatus = 'idle';
    if (status === 'running') {
      if (isStreamingNow) {
        agentStatus = 'streaming';
      } else if (isActive) {
        agentStatus = 'responding';
      } else if (agentEvents.length > 0) {
        const last = agentEvents[agentEvents.length - 1];
        agentStatus =
          last.type === 'done'
            ? 'done'
            : last.type === 'error'
            ? 'error'
            : last.type === 'complete'
            ? 'done'
            : 'thinking';
      }
    } else if (status === 'complete') {
      agentStatus = 'done';
    } else if (status === 'error') {
      agentStatus = 'error';
    }

    return {
      agentId,
      status: agentStatus,
      thoughts: status === 'idle' ? [] : thoughts,
      streamingText,
      isActive,
    };
  });

  // ── shared node/edge panel content ─────────────────────────────────────────

  const activeAgentIds = MODE_AGENTS[activeMode];
  const filteredPanels = panelsData.filter((p) => activeAgentIds.includes(p.agentId));

  const renderedAgentPanels = (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {filteredPanels.map((panel, index) => (
          <motion.div
            key={panel.agentId}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            style={{ width: '100%' }}
          >
            <AgentPanel
              agentId={panel.agentId}
              status={panel.status}
              thoughts={panel.thoughts}
              streamingText={panel.streamingText}
              isActive={panel.isActive}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const agentsPanelContent = (
    <div
      style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}
      className="nx-thin-scroll"
    >
      {renderedAgentPanels}
    </div>
  );

  const outputPanelContent = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 16px 16px' }}>
      <ModeSelector
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onSubmit={(q) => {
          handleQuerySubmit(q);
          setOutputOpen(false);
        }}
        isRunning={status === 'running'}
        suggestedMode={
          processedQuery && processedQuery.modeConfidence >= 0.65
            ? processedQuery.detectedMode
            : null
        }
        onAcceptSuggestion={(m) => setActiveMode(m)}
      />
      <div
        style={{
          height: 1,
          background: 'var(--nx-border)',
          margin: '16px 0',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <VerdictPanel 
          verdict={verdict} 
          mode={activeMode}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          isRunning={status === 'running'}
          query={query}
          nodes={nodes}
        />
      </div>
    </div>
  );

  // ── DEMO button ──────────────────────────────────────────────────────────

  const DemoButton = (
    <button
      type="button"
      disabled={status === 'running'}
      onClick={() =>
        startSession('debate', 'Should AI replace human workers?', true)
      }
      style={{
        fontFamily: 'var(--nx-font-mono), monospace',
        fontSize: 10,
        padding: '4px 10px',
        border: '1px solid var(--nx-border)',
        background: 'rgba(255,255,255,0.02)',
        color: '#fff',
        cursor: status === 'running' ? 'not-allowed' : 'pointer',
        opacity: status === 'running' ? 0.45 : 1,
        borderRadius: 0,
        transition: 'background 150ms',
      }}
      onMouseEnter={(e) => {
        if (status !== 'running')
          (e.currentTarget as HTMLButtonElement).style.background =
            'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255,255,255,0.02)';
      }}
    >
      DEMO
    </button>
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── global style tag ───────────────────────────────────────────── */}
      <style>{`
        /* thin custom scrollbar shared across panels */
        .nx-thin-scroll::-webkit-scrollbar { width: 2px; }
        .nx-thin-scroll::-webkit-scrollbar-track { background: transparent; }
        .nx-thin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

        @keyframes topbar-pulse {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 1;   }
        }
        .topbar-dot { animation: topbar-pulse 1.5s ease-in-out infinite; }

        @keyframes agent-pulse {
          0%,100% { transform: scale(0.9); opacity: 0.5; }
          50%     { transform: scale(1.3); opacity: 1;   }
        }
        .agent-dot-active { animation: agent-pulse 1.2s ease-in-out infinite; }
      `}</style>

      {/* ── desktop 3-column grid ──────────────────────────────────────── */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 320px',
          gridTemplateRows: isMobile ? '40px 1fr 32px' : '40px 1fr 32px',
          gridTemplateAreas: isMobile
            ? `"topbar" "canvas" "statusbar"`
            : `"topbar topbar topbar" "sidebar canvas rightpanel" "statusbar statusbar statusbar"`,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--nx-bg)',
        }}
      >
        {/* ── TOP BAR ─────────────────────────────────────────────────── */}
        <div
          style={{
            gridArea: 'topbar',
            backgroundColor: 'var(--nx-bg-elevated)',
            borderBottom: '1px solid var(--nx-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 30,
          }}
        >
          {/* Logo + live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--nx-font-display), sans-serif',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.2em',
                color: '#fff',
                userSelect: 'none',
              }}
            >
              NEXUS
            </span>
            <span
              className="topbar-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#1D9E75',
                boxShadow: '0 0 6px #1D9E75',
                display: 'inline-block',
              }}
            />
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {DemoButton}
            <span
              style={{
                fontFamily: 'var(--nx-font-mono), monospace',
                fontSize: 10,
                color: 'var(--nx-text-muted)',
              }}
            >
              Session 001
            </span>
          </div>
        </div>

        {/* ── LEFT SIDEBAR (desktop only) ─────────────────────────────── */}
        {!isMobile && (
          <div
            className="nx-thin-scroll"
            style={{
              gridArea: 'sidebar',
              backgroundColor: 'var(--nx-bg-elevated)',
              borderRight: '1px solid var(--nx-border)',
              overflowY: 'auto',
              padding: '12px',
              zIndex: 20,
            }}
          >
            {renderedAgentPanels}
          </div>
        )}

        {/* ── CENTER CANVAS ───────────────────────────────────────────── */}
        <div
          style={{
            gridArea: 'canvas',
            backgroundColor: 'var(--nx-bg)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 10,
            // pad bottom so mobile FABs don't cover graph nodes
            paddingBottom: isMobile ? 80 : 0,
          }}
        >
          <NexusGraph
            nodes={nodes}
            edges={edges}
            activeAgents={activeAgents}
            onNodeClick={setSelectedNode}
            selectedNodeId={selectedNode?.id ?? null}
            mode={activeMode}
          />

          {/* Empty-state overlay */}
          <AnimatePresence>
            {nodes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    border: '1px dashed rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--nx-font-display), sans-serif',
                      fontWeight: 800,
                      fontSize: 24,
                      letterSpacing: '0.15em',
                      color: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    NEXUS
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--nx-font-mono), monospace',
                    fontSize: 11,
                    color: 'var(--nx-text-muted)',
                  }}
                >
                  Enter a query to begin
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT PANEL (desktop only) ──────────────────────────────── */}
        {!isMobile && (
          <div
            style={{
              gridArea: 'rightpanel',
              backgroundColor: 'var(--nx-bg-elevated)',
              borderLeft: '1px solid var(--nx-border)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
            }}
          >
            <div style={{ padding: 16, flexShrink: 0 }}>
              <ModeSelector
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onSubmit={handleQuerySubmit}
                isRunning={status === 'running'}
                suggestedMode={
                  processedQuery && processedQuery.modeConfidence >= 0.65
                    ? processedQuery.detectedMode
                    : null
                }
                onAcceptSuggestion={(m) => setActiveMode(m)}
              />
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--nx-border)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <VerdictPanel 
                verdict={verdict} 
                mode={activeMode}
                nodeCount={nodes.length}
                edgeCount={edges.length}
                isRunning={status === 'running'}
                query={query}
                nodes={nodes}
              />
            </div>
          </div>
        )}

        {/* ── STATUS BAR ─────────────────────────────────────────────── */}
        <div
          style={{
            gridArea: 'statusbar',
            backgroundColor: 'var(--nx-bg-elevated)',
            borderTop: '1px solid var(--nx-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            gap: 16,
            zIndex: 30,
          }}
        >
          {/* Agent pips */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {CORE_AGENTS.map((id) => {
              const active = activeAgents.includes(id);
              const color = getAgentColor(id);
              return (
                <span
                  key={id}
                  className={active ? 'agent-dot-active' : undefined}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: active ? `0 0 6px ${color}` : 'none',
                    display: 'inline-block',
                    transition: 'all 0.3s',
                  }}
                />
              );
            })}
          </div>

          {/* Stats */}
          <span
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {nodes.length} nodes · {edges.length} edges ·{' '}
            {activeMode.toUpperCase()} mode
          </span>

          {/* Clock */}
          <span
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: 10,
              color: 'var(--nx-text-muted)',
            }}
          >
            {timeString}
          </span>
        </div>
      </main>

      {/* ── MOBILE LAYER (only renders on small screens) ──────────────── */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <Backdrop
            open={agentsOpen || outputOpen}
            onClose={closeAll}
          />

          {/* AGENTS sheet (60vh) */}
          <BottomSheet
            open={agentsOpen}
            onClose={() => setAgentsOpen(false)}
            height="60vh"
          >
            <div
              style={{
                padding: '0 16px 4px',
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                  margin: 0,
                  paddingBottom: 8,
                }}
              >
                Active Agent Swarm
              </p>
            </div>
            {agentsPanelContent}
          </BottomSheet>

          {/* OUTPUT sheet (50vh) */}
          <BottomSheet
            open={outputOpen}
            onClose={() => setOutputOpen(false)}
            height="50vh"
          >
            {outputPanelContent}
          </BottomSheet>

          {/* FAB row — fixed above status bar */}
          <div
            style={{
              position: 'fixed',
              bottom: 16,
              left: 0,
              right: 0,
              zIndex: 45,
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              pointerEvents: 'none', // let touches pass through gaps
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <FAB
                label="⚡ AGENTS"
                active={agentsOpen}
                onClick={() => {
                  setOutputOpen(false);
                  setAgentsOpen((v) => !v);
                }}
              />
            </div>
            <div style={{ pointerEvents: 'auto' }}>
              <FAB
                label="→ OUTPUT"
                active={outputOpen}
                onClick={() => {
                  setAgentsOpen(false);
                  setOutputOpen((v) => !v);
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Node Detail Drawer — slides up from bottom on node click */}
      <AnimatePresence>
        <NodeDetailDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          allNodes={nodes}
          allEdges={edges}
        />
      </AnimatePresence>
    </>
  );
}