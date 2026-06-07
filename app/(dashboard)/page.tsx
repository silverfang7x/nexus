'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NexusGraph from '@/components/canvas/NexusGraph';
import { AgentPanelList } from '@/components/agents/AgentPanel';
import ModeSelector from '@/components/ui/ModeSelector';
import VerdictPanel from '@/components/output/VerdictPanel';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useGraph } from '@/hooks/useGraph';
import { AGENT_CONFIGS } from '@/lib/gemini';
import { AgentId, AgentStatus, NexusMode } from '@/types/nexus';
import { getAgentColor } from '@/components/canvas/GraphNode';

const coreAgents: AgentId[] = ['advocate', 'challenger', 'factchecker', 'codeanalyst', 'synthesizer'];

export default function Dashboard() {
  const { nodes, edges, events, status, verdict, activeAgents, startSession } = useAgentStream();
  
  // Call useGraph hook to register the D3 simulation updates in parent scope
  useGraph(nodes, edges);

  const [activeMode, setActiveMode] = useState<NexusMode>('debate');
  const [timeString, setTimeString] = useState('');
  
  // Mobile responsive bottom sheets states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightpanelOpen, setIsRightpanelOpen] = useState(false);

  // Enforce html, body, and __next height and overflow parameters
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const nextDiv = document.getElementById('__next');

    const prevHtmlHeight = htmlEl.style.height;
    const prevHtmlOverflow = htmlEl.style.overflow;
    const prevBodyHeight = bodyEl.style.height;
    const prevBodyOverflow = bodyEl.style.overflow;

    htmlEl.style.height = '100vh';
    htmlEl.style.overflow = 'hidden';
    bodyEl.style.height = '100vh';
    bodyEl.style.overflow = 'hidden';

    if (nextDiv) {
      nextDiv.style.height = '100vh';
      nextDiv.style.overflow = 'hidden';
    }

    return () => {
      htmlEl.style.height = prevHtmlHeight;
      htmlEl.style.overflow = prevHtmlOverflow;
      bodyEl.style.height = prevBodyHeight;
      bodyEl.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Update clock in status bar every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuerySubmit = (query: string) => {
    // If we're not running DEBATE mode, use mock fallback since the backend lacks live agents
    const isMockMode = activeMode !== 'debate' || query.includes('--mock');
    const cleanQuery = query.replace('--mock', '').trim();
    startSession(activeMode, cleanQuery, isMockMode);
  };

  // Compile active agent thought streams from event log
  const panelsData = coreAgents.map((agentId) => {
    const isAgentActive = activeAgents.includes(agentId);
    
    // Compile thoughts from the events stream
    const agentEvents = events.filter(e => e.agentId === agentId);
    const thoughts = agentEvents
      .map(e => e.payload.text || '')
      .filter(Boolean);

    const isRunning = status === 'running';
    
    let agentStatus: AgentStatus = 'idle';
    if (isRunning) {
      if (isAgentActive) {
        agentStatus = 'responding';
      } else if (agentEvents.length > 0) {
        const lastEvent = agentEvents[agentEvents.length - 1];
        if (lastEvent.type === 'done') agentStatus = 'done';
        else if (lastEvent.type === 'error') agentStatus = 'error';
        else agentStatus = 'thinking';
      }
    } else if (status === 'complete') {
      agentStatus = 'done';
    } else if (status === 'error') {
      agentStatus = 'error';
    }

    return {
      agentId,
      status: agentStatus,
      thoughts: isRunning || status === 'complete' || status === 'error' ? thoughts : [],
      isActive: isAgentActive
    };
  });

  return (
    <main
      className="dashboard-main w-screen h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 320px',
        gridTemplateRows: '40px 1fr 32px',
        gridTemplateAreas: `
          "topbar topbar topbar"
          "sidebar canvas rightpanel"
          "statusbar statusbar statusbar"
        `,
        backgroundColor: 'var(--nx-bg)'
      }}
    >
      {/* CSS stylesheet injection for custom responsive layouts, transitions, and webkit custom scrollbars */}
      <style>{`
        @media (max-width: 767px) {
          .dashboard-main {
            grid-template-columns: 1fr !important;
            grid-template-rows: 40px 1fr auto !important;
            grid-template-areas:
              "topbar"
              "canvas"
              "statusbar" !important;
            height: 100vh;
            width: 100vw;
          }
          .desktop-sidebar {
            display: none !important;
          }
          .desktop-rightpanel {
            display: none !important;
          }
          .mobile-fab-container {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .desktop-sidebar {
            display: block !important;
          }
          .desktop-rightpanel {
            display: flex !important;
          }
          .mobile-fab-container {
            display: none !important;
          }
        }

        /* Webkit custom scrollbars for left sidebar scroll context */
        .left-sidebar-scroll::-webkit-scrollbar {
          width: 2px;
        }
        .left-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .left-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Pulsing dot in top bar */
        @keyframes topbar-dot-pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .topbar-pulse-dot {
          animation: topbar-dot-pulse 1.5s infinite ease-in-out;
        }

        /* Pulsing dot in status bar */
        @keyframes active-dot-pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
        .active-pulse-dot {
          animation: active-dot-pulse 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* TOP BAR */}
      <div
        style={{
          gridArea: 'topbar',
          backgroundColor: 'var(--nx-bg-elevated)',
          borderBottom: '1px solid var(--nx-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 30
        }}
      >
        <div className="flex items-center gap-2 select-none">
          <span
            style={{
              fontFamily: 'var(--nx-font-display), sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.2em',
              color: '#ffffff'
            }}
          >
            NEXUS
          </span>
          <span
            className="topbar-pulse-dot w-1.5 h-1.5 rounded-full bg-[#1D9E75]"
            style={{ boxShadow: '0 0 6px #1D9E75' }}
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={status === 'running'}
            onClick={() => startSession('debate', 'Should AI replace human workers?', true)}
            className="px-2.5 py-1 text-white border transition-colors select-none rounded-none cursor-pointer focus:outline-none"
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '10px',
              borderColor: 'var(--nx-border)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              opacity: status === 'running' ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (status !== 'running') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              if (status !== 'running') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            DEMO
          </button>
          <div
            style={{
              fontFamily: 'var(--nx-font-mono), monospace',
              fontSize: '10px',
              color: 'var(--nx-text-muted)'
            }}
          >
            Session 001
          </div>
        </div>
      </div>

      {/* LEFT SIDEBAR (Desktop) */}
      <div
        className="desktop-sidebar left-sidebar-scroll"
        style={{
          gridArea: 'sidebar',
          backgroundColor: 'var(--nx-bg-elevated)',
          borderRight: '1px solid var(--nx-border)',
          overflowY: 'auto',
          padding: '12px 12px',
          zIndex: 20
        }}
      >
        <AgentPanelList panels={panelsData} />
      </div>

      {/* CENTER CANVAS */}
      <div
        style={{
          gridArea: 'canvas',
          backgroundColor: 'var(--nx-bg)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10
        }}
      >
        {/* Nexus D3 Graph component */}
        <NexusGraph
          nodes={nodes}
          edges={edges}
          activeAgents={activeAgents}
          onNodeClick={(node) => console.log('Node clicked:', node)}
        />

        {/* Empty State Centered Overlay */}
        <AnimatePresence>
          {nodes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
            >
              <div
                className="w-[200px] h-[200px] rounded-full border border-dashed flex items-center justify-center mb-4"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--nx-font-display), sans-serif',
                    fontWeight: 800,
                    fontSize: '24px',
                    letterSpacing: '0.15em',
                    color: '#ffffff',
                    opacity: 0.15
                  }}
                >
                  NEXUS
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--nx-font-mono), monospace',
                  fontSize: '11px',
                  color: 'var(--nx-text-muted)'
                }}
              >
                Enter a query to begin
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile floating buttons */}
        <div className="mobile-fab-container fixed bottom-14 left-1/2 -translate-x-1/2 z-30 hidden gap-4">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="px-4 py-2 bg-[#12121A] border border-white/20 text-white text-[10px] font-bold tracking-wider uppercase rounded-none hover:bg-white hover:text-black transition-colors"
          >
            ⚡ AGENTS
          </button>
          <button
            type="button"
            onClick={() => setIsRightpanelOpen(true)}
            className="px-4 py-2 bg-[#12121A] border border-white/20 text-white text-[10px] font-bold tracking-wider uppercase rounded-none hover:bg-white hover:text-black transition-colors"
          >
            → OUTPUT
          </button>
        </div>
      </div>

      {/* RIGHT PANEL (Desktop) */}
      <div
        className="desktop-rightpanel"
        style={{
          gridArea: 'rightpanel',
          backgroundColor: 'var(--nx-bg-elevated)',
          borderLeft: '1px solid var(--nx-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20
        }}
      >
        <div className="p-4" style={{ minHeight: '190px' }}>
          <ModeSelector
            activeMode={activeMode}
            onModeChange={setActiveMode}
            onSubmit={handleQuerySubmit}
            isRunning={status === 'running'}
          />
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--nx-border)', margin: 0 }} />
        <div className="flex-1 overflow-hidden">
          <VerdictPanel verdict={verdict} />
        </div>
      </div>

      {/* STATUS BAR */}
      <div
        style={{
          gridArea: 'statusbar',
          backgroundColor: 'var(--nx-bg-elevated)',
          borderTop: '1px solid var(--nx-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          gap: '16px',
          zIndex: 30
        }}
      >
        {/* Left active dot pulses */}
        <div className="flex items-center gap-2">
          {coreAgents.map((agentId) => {
            const isAgentActive = activeAgents.includes(agentId);
            const color = getAgentColor(agentId);
            return (
              <span
                key={agentId}
                className={`w-1.5 h-1.5 rounded-full ${isAgentActive ? 'active-pulse-dot' : ''}`}
                style={{
                  backgroundColor: color,
                  boxShadow: isAgentActive ? `0 0 6px ${color}` : 'none',
                  display: 'inline-block',
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })}
        </div>

        {/* Center stats */}
        <div
          style={{
            fontFamily: 'var(--nx-font-mono), monospace',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          {nodes.length} nodes · {edges.length} edges · {activeMode.toUpperCase()} mode
        </div>

        {/* Right time info */}
        <div
          style={{
            fontFamily: 'var(--nx-font-mono), monospace',
            fontSize: '10px',
            color: 'var(--nx-text-muted)'
          }}
        >
          {timeString}
        </div>
      </div>

      {/* Mobile Backdrops and Bottom Sheets */}
      <AnimatePresence>
        {(isSidebarOpen || isRightpanelOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsSidebarOpen(false);
              setIsRightpanelOpen(false);
            }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121A] border-t border-white/10 p-4 h-[75vh] overflow-y-auto left-sidebar-scroll"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs tracking-widest text-white/40 uppercase font-bold">Active Agent Swarm</h3>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[10px] text-white/50 hover:text-white uppercase font-mono font-bold px-2.5 py-1.5 border border-white/10 rounded-none cursor-pointer"
              >
                Close
              </button>
            </div>
            <AgentPanelList panels={panelsData} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRightpanelOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121A] border-t border-white/10 p-4 h-[85vh] overflow-y-auto flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs tracking-widest text-white/40 uppercase font-bold font-display">Nexus Control</h3>
              <button
                type="button"
                onClick={() => setIsRightpanelOpen(false)}
                className="text-[10px] text-white/50 hover:text-white uppercase font-mono font-bold px-2.5 py-1.5 border border-white/10 rounded-none cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <ModeSelector
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onSubmit={(q) => {
                  handleQuerySubmit(q);
                  setIsRightpanelOpen(false); // Auto-close output panel so they see the graph!
                }}
                isRunning={status === 'running'}
              />
              <div style={{ height: '1px', backgroundColor: 'var(--nx-border)', margin: '16px 0' }} />
              <div className="flex-1 overflow-y-auto">
                <VerdictPanel verdict={verdict} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}