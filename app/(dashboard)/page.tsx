'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NexusGraph from '@/components/canvas/NexusGraph';
import AgentPanel from '@/components/agents/AgentPanel';
import ModeSelector from '@/components/ui/ModeSelector';
import VerdictPanel from '@/components/output/VerdictPanel';
import ExportButton from '@/components/output/ExportButton';
import SessionBar from '@/components/ui/SessionBar';
import { saveSession, getSessions, NexusSession } from '@/lib/sessionStorage';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useGraph } from '@/hooks/useGraph';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AgentId, NexusMode, GraphNode, AgentEvent, AllModeStates, createBlankModeState, ModeState } from '@/types/nexus';
import { getAgentColor } from '@/components/canvas/GraphNode';
import NodeDetailPanel from '@/components/canvas/NodeDetailPanel';
import { CanvasLoader } from '@/components/canvas/CanvasLoader';

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

const DEMO_QUERIES: Record<NexusMode, { 
  query: string; 
  label: string; 
}> = {
  debate: { 
    query: 'Should social media platforms be held legally responsible for mental health damage to teenagers?',
    label: 'Social Media Liability'
  },
  plan: { 
    query: 'Build a peer-to-peer skill exchange platform for Indian college students — like Fiverr but for learning',
    label: 'Skill Exchange Platform'
  },
  research: {
    query: 'What are the real tradeoffs between RAG and fine-tuning for production LLM applications in 2026?',
    label: 'RAG vs Fine-tuning'
  },
  code: {
    query: 'https://github.com/vercel/next.js',
    label: 'Next.js Codebase'
  }
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

// ─── Copy Button ──────────────────────────────────────────────────────────────

interface CopyButtonProps {
  output: unknown;
}

function CopyButton({ output }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const disabled = !output;

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      style={{
        fontFamily: 'var(--nx-font-mono), monospace',
        fontSize: '9px',
        border: `1px solid ${disabled ? 'rgba(255, 255, 255, 0.05)' : 'var(--nx-border)'}`,
        background: copied ? 'rgba(29, 158, 117, 0.1)' : 'rgba(255, 255, 255, 0.02)',
        padding: '4px 10px',
        borderRadius: 0,
        color: copied ? 'var(--nx-factchecker)' : 'rgba(255, 255, 255, 0.8)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 150ms',
        userSelect: 'none',
      }}
    >
      {copied ? 'COPIED ✓' : 'COPY'}
    </button>
  );
}

// ─── main dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [modeStates, setModeStates] = useState<AllModeStates>({
    debate: createBlankModeState(),
    research: createBlankModeState(),
    code: createBlankModeState(),
    plan: createBlankModeState()
  });

  const [activeMode, setActiveMode] = useState<NexusMode>('debate');

  const updateModeState = useCallback((
    mode: NexusMode,
    updateFn: (prev: ModeState) => Partial<ModeState>
  ) => {
    setModeStates(prev => {
      const currentState = prev[mode];
      const updates = updateFn(currentState);
      return {
        ...prev,
        [mode]: { ...currentState, ...updates }
      };
    });
  }, []);

  const currentState = modeStates[activeMode];

  const debateStream = useAgentStream('debate', modeStates.debate, useCallback((fn: (prev: ModeState) => Partial<ModeState>) => updateModeState('debate', fn), [updateModeState]));
  const researchStream = useAgentStream('research', modeStates.research, useCallback((fn: (prev: ModeState) => Partial<ModeState>) => updateModeState('research', fn), [updateModeState]));
  const codeStream = useAgentStream('code', modeStates.code, useCallback((fn: (prev: ModeState) => Partial<ModeState>) => updateModeState('code', fn), [updateModeState]));
  const planStream = useAgentStream('plan', modeStates.plan, useCallback((fn: (prev: ModeState) => Partial<ModeState>) => updateModeState('plan', fn), [updateModeState]));

  const activeStream = {
    debate: debateStream,
    research: researchStream,
    code: codeStream,
    plan: planStream
  }[activeMode];

  const {
    query,
    nodes,
    edges,
    status,
    verdict,
    activeAgents,
    processedQuery,
    startStream,
    addNode,
    addEdge,
    clearStream,
    isContinuationReady
  } = activeStream;

  const clearSession = clearStream;

  useGraph(nodes, edges);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setCanvasDimensions({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isRunning = status === 'running';

  const isMobile = useMediaQuery('(max-width: 767px)');

  const [sessionNum, setSessionNum] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nx-session-count');
      if (stored) return parseInt(stored, 10);
      localStorage.setItem('nx-session-count', '1');
      return 1;
    }
    return 1;
  });
  const [timeString, setTimeString] = useState('');
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandingNode, setExpandingNode] = useState<string | null>(null);

  const handleExpandTasks = async (node: GraphNode) => {
    setExpandingNode(node.id);
    
    // Build project context from existing nodes
    const projectContext = nodes
      .filter(n => n.type === 'feature' || n.type === 'milestone')
      .map(n => n.label + ': ' + n.content)
      .slice(0, 6)  // max 6 nodes for context
      .join('\n');
    
    try {
      // Consume the SSE stream from /api/decompose
      const response = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneLabel: node.label,
          milestoneContent: node.content,
          projectContext,
          parentNodeId: node.id
        })
      });
      
      // Read SSE stream — reuse the same pattern as useAgentStream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event: AgentEvent = JSON.parse(trimmed.slice(6));
              if (event.type === 'node_created' && event.payload.node) {
                addNode(event.payload.node);
              }
              if (event.type === 'edge_created' && event.payload.edge) {
                addEdge(event.payload.edge);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Error expanding milestone tasks:", err);
    } finally {
      setExpandingNode(null);
      setSelectedNode(null);  // close the detail panel
    }
  };

  // --- Session History State & Refs ---
  const [sessions, setSessions] = useState<NexusSession[]>(() => {
    if (typeof window !== 'undefined') {
      return getSessions();
    }
    return [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [graphScale, setGraphScale] = useState(1);

  const startTimestampRef = useRef<Record<NexusMode, number>>({
    debate: 0,
    research: 0,
    code: 0,
    plan: 0
  });
  const [runsInProgress, setRunsInProgress] = useState<Record<NexusMode, boolean>>({
    debate: false,
    research: false,
    code: false,
    plan: false
  });

  // Save session when run completes
  useEffect(() => {
    const modes: NexusMode[] = ['debate', 'research', 'code', 'plan'];
    const streams = {
      debate: debateStream,
      research: researchStream,
      code: codeStream,
      plan: planStream
    };

    modes.forEach(mode => {
      const stream = streams[mode];
      if (stream.status === 'complete' && runsInProgress[mode]) {
        setRunsInProgress(prev => ({ ...prev, [mode]: false }));
        const durationMs = Date.now() - startTimestampRef.current[mode];
        const newSession: NexusSession = {
          id: '', // to be assigned by saveSession
          mode: mode,
          query: stream.query,
          cleanQuery: stream.processedQuery?.cleanQuery || stream.query,
          nodes: stream.nodes,
          edges: stream.edges,
          structuredOutput: stream.verdict,
          timestamp: Date.now(),
          durationMs
        };
        saveSession(newSession);
        const updated = getSessions();
        setSessions(updated);
        setActiveSessionId('001'); // newly saved is always the most recent (001)
      }
    });
  }, [
    debateStream,
    researchStream,
    codeStream,
    planStream,
    runsInProgress
  ]);

  const handleQuerySubmit = (submittedQuery: string, isContinuation = false, forceMock = false) => {
    const isMock = forceMock || submittedQuery.includes('--mock');
    const clean = submittedQuery.replace('--mock', '').trim();
    
    // eslint-disable-next-line react-hooks/purity
    startTimestampRef.current[activeMode] = Date.now();
    setRunsInProgress(prev => ({ ...prev, [activeMode]: true }));
    setActiveSessionId(null);
    updateModeState(activeMode, () => ({ query: clean }));

    const nextNum = parseInt(localStorage.getItem('nx-session-count') || '0', 10) + 1;
    localStorage.setItem('nx-session-count', String(nextNum));
    setSessionNum(nextNum);
    
    startStream(clean, isMock, isContinuation);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes the node detail panel
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
      // Cmd/Ctrl + D triggers DEMO mode
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const scenario = DEMO_QUERIES[activeMode];
        if (scenario && status !== 'running') {
          handleQuerySubmit(scenario.query, false, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, status]);

  // Handle restoring a session
  const handleRestoreSession = (session: NexusSession) => {
    const targetMode = session.mode;
    const streams = {
      debate: debateStream,
      research: researchStream,
      code: codeStream,
      plan: planStream
    };
    streams[targetMode].restoreStream(session);

    setActiveSessionId(session.id);
    setActiveMode(session.mode);

    // Apply scale flash effect
    setGraphScale(0.97);
    setTimeout(() => setGraphScale(1), 150);
  };

  const closeAll = useCallback(() => {
    setAgentsOpen(false);
    setOutputOpen(false);
  }, [setAgentsOpen, setOutputOpen]);

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

  // Build panel data from live event stream
  const panelsData = CORE_AGENTS.map((agentId) => {
    const agentStatus = currentState.agentStatuses[agentId] ?? 'idle';
    const streamingText = currentState.agentThoughts[agentId] ?? '';
    const isActive = activeAgents.includes(agentId);

    return {
      agentId,
      status: agentStatus,
      thoughts: streamingText ? [streamingText] : [],
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
        onSubmit={(q, isCont) => {
          handleQuerySubmit(q, isCont);
          setOutputOpen(false);
        }}
        isRunning={status === 'running'}
        suggestedMode={
          processedQuery && processedQuery.modeConfidence >= 0.65
            ? processedQuery.detectedMode
            : null
        }
        onAcceptSuggestion={(m) => setActiveMode(m)}
        query={currentState.query}
        onQueryChange={(q) => updateModeState(activeMode, () => ({ query: q }))}
        isContinuationReady={isContinuationReady}
        nodeCount={nodes.length}
        onClear={clearSession}
        hasRunStates={{
          debate: modeStates.debate.hasRun,
          research: modeStates.research.hasRun,
          code: modeStates.code.hasRun,
          plan: modeStates.plan.hasRun
        }}
      />
      <div
        style={{
          height: 1,
          background: 'var(--nx-border)',
          margin: '16px 0',
          flexShrink: 0,
        }}
      />
      <div className="output-scroll-panel" style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <VerdictPanel 
          output={verdict} 
          mode={activeMode}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          isRunning={status === 'running'}
          query={query}
          nodes={nodes}
          session={{ query, mode: activeMode, nodes, edges }}
          hasRun={currentState.hasRun}
        />
      </div>
      {/* Export + Copy buttons row */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        gap: 8,
        padding: '10px 16px',
        borderTop: '1px solid var(--nx-border)',
        background: 'var(--nx-surface)',
        opacity: currentState.structuredOutput ? 1 : 0.4,
        pointerEvents: currentState.structuredOutput ? 'auto' : 'none',
        marginTop: 12,
      }}>
        <CopyButton output={currentState.structuredOutput} />
        <ExportButton
          mode={activeMode}
          query={currentState.query}
          output={currentState.structuredOutput}
          nodes={currentState.nodes}
        />
      </div>
    </div>
  );

  // ── DEMO button ──────────────────────────────────────────────────────────

  const DemoButton = (
    <button
      type="button"
      disabled={status === 'running'}
      onClick={() => {
        const scenario = DEMO_QUERIES[activeMode];
        if (scenario) {
          handleQuerySubmit(scenario.query, false, true);
        }
      }}
      title={DEMO_QUERIES[activeMode]?.label || 'Run Scenario'}
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

  // Compute connected nodes for selectedNode
  const connectedNodes = selectedNode
    ? nodes.filter(n =>
        edges.some(
          e => {
            const src = typeof e.source === 'object' && e.source !== null && 'id' in e.source
              ? (e.source as { id: string }).id
              : e.source as string;
            const tgt = typeof e.target === 'object' && e.target !== null && 'id' in e.target
              ? (e.target as { id: string }).id
              : e.target as string;
            return (src === selectedNode.id && tgt === n.id) || (tgt === selectedNode.id && src === n.id);
          }
        )
      )
    : [];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="nexus-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 360px',
        gridTemplateRows: isMobile ? 'auto 1fr' : '36px 1fr',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
        <SessionBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onRestoreSession={handleRestoreSession}
          currentMode={activeMode}
          isRunning={status === 'running'}
        />
      </div>
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
        data-mode={activeMode}
        style={{
          gridColumn: isMobile ? 'auto' : '1 / -1',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 360px',
          gridTemplateRows: isMobile ? '40px 1fr 32px' : '40px 1fr 32px',
          gridTemplateAreas: isMobile
            ? `"topbar" "canvas" "statusbar"`
            : `"topbar topbar topbar" "sidebar canvas rightpanel" "statusbar statusbar statusbar"`,
          width: '100%',
          height: '100%',
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
              {activeSessionId ? `Session ${activeSessionId}` : `Session ${String(sessionNum).padStart(3, '0')}`}
            </span>
          </div>
        </div>

        {/* ── LEFT SIDEBAR (desktop only) ─────────────────────────────── */}
        {!isMobile && (
          <div
            className="nx-thin-scroll left-agent-column"
            style={{
              gridArea: 'sidebar',
              backgroundColor: 'var(--nx-bg-elevated)',
              borderRight: '1px solid var(--nx-border)',
              padding: '12px',
              zIndex: 20,
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {renderedAgentPanels}
          </div>
        )}

        {/* ── CENTER CANVAS ───────────────────────────────────────────── */}
        <motion.div
          ref={canvasRef}
          animate={{ scale: graphScale }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
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
          {isRunning && nodes.length === 0 && (
            <CanvasLoader width={canvasDimensions.width} height={canvasDimensions.height} />
          )}

          <NexusGraph
            nodes={nodes}
            edges={edges}
            onNodeClick={setSelectedNode}
            selectedNodeId={selectedNode?.id ?? null}
            mode={activeMode}
            isLoading={status === 'running'}
          />

          {/* Empty-state overlay */}
          <AnimatePresence>
            {nodes.length === 0 && status === 'idle' && (
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
        </motion.div>

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
                query={currentState.query}
                onQueryChange={(q) => updateModeState(activeMode, () => ({ query: q }))}
                isContinuationReady={isContinuationReady}
                nodeCount={nodes.length}
                onClear={clearSession}
                hasRunStates={{
                  debate: modeStates.debate.hasRun,
                  research: modeStates.research.hasRun,
                  code: modeStates.code.hasRun,
                  plan: modeStates.plan.hasRun
                }}
              />
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--nx-border)',
                flexShrink: 0,
              }}
            />
            <div className="output-scroll-panel" style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
              <VerdictPanel 
                output={verdict} 
                mode={activeMode}
                nodeCount={nodes.length}
                edgeCount={edges.length}
                isRunning={status === 'running'}
                query={query}
                nodes={nodes}
                session={{ query, mode: activeMode, nodes, edges }}
                hasRun={currentState.hasRun}
              />
            </div>
            {/* Export + Copy buttons row */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              gap: 8,
              padding: '10px 16px',
              borderTop: '1px solid var(--nx-border)',
              background: 'var(--nx-surface)',
              opacity: currentState.structuredOutput ? 1 : 0.4,
              pointerEvents: currentState.structuredOutput ? 'auto' : 'none',
            }}>
              <CopyButton output={currentState.structuredOutput} />
              <ExportButton
                mode={activeMode}
                query={currentState.query}
                output={currentState.structuredOutput}
                nodes={currentState.nodes}
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

      {/* Node Detail Panel — slides up from bottom on node click */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            connectedNodes={connectedNodes}
            allNodes={nodes}
            onClose={() => setSelectedNode(null)}
            onExpandTasks={handleExpandTasks}
            isExpanding={expandingNode === selectedNode.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}