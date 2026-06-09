import { useState, useCallback, useRef, useEffect } from "react";
import { AgentEvent, GraphEdge, GraphNode, NexusMode, AgentId, AgentStatus, ModeState } from "@/types/nexus";

export type SessionStatus = 'idle' | 'running' | 'complete' | 'error' | 'ready_for_continuation';

/** Mirrors the shape of ProcessedQuery for client-side use */
export interface ClientProcessedQuery {
  cleanQuery: string;
  detectedMode: NexusMode;
  modeConfidence: number;
  intent: string;
  domain: string;
  entities: string[];
  wasAmbiguous: boolean;
  originalQuery: string;
  enrichedQuery: string;
}

export interface RestoreSessionData {
  query: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  structuredOutput: unknown;
  cleanQuery?: string;
  mode: NexusMode;
}

export function useAgentStream(
  mode: NexusMode,
  currentState: ModeState,
  onStateChange: (updateFn: (prev: ModeState) => Partial<ModeState>) => void
) {
  const [processedQuery, setProcessedQuery] = useState<ClientProcessedQuery | null>(null);
  const [showContinuation, setShowContinuation] = useState(false);

  const sessionIndexRef = useRef(0);
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    return () => {
      if (continuationTimeoutRef.current) {
        clearTimeout(continuationTimeoutRef.current);
      }
      if (activeReaderRef.current) {
        activeReaderRef.current.cancel().catch(() => {});
      }
    };
  }, []);

  const startStream = useCallback(async (query: string, useMock = false, isContinuation = false) => {
    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }

    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel();
      } catch (e) {
        console.error("Error cancelling active reader:", e);
      }
      activeReaderRef.current = null;
    }

    setShowContinuation(false);

    if (!isContinuation) {
      sessionIndexRef.current = 0;
      onStateChange(() => ({
        query,
        nodes: [],
        edges: [],
        structuredOutput: null,
        agentThoughts: {},
        agentStatuses: {},
        isRunning: true,
        hasRun: false
      }));
    } else {
      sessionIndexRef.current += 1;
      onStateChange(() => ({
        query,
        agentThoughts: {},
        isRunning: true,
        hasRun: true
      }));
    }

    setProcessedQuery(null);

    try {
      const continuationContext = isContinuation ? {
        existingNodes: currentState.nodes,
        previousQuery: currentState.query,
        mode: mode
      } : undefined;

      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode, query, useMock, continuationContext }),
      });

      if (!response.ok) {
        throw new Error("HTTP error! status: " + response.status);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      activeReaderRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.slice(6);
            if (!dataStr.trim()) continue;

            try {
              const event = JSON.parse(dataStr) as AgentEvent;

              if (event.type === 'node_created' && event.payload.node) {
                const nodeWithSession = {
                  ...event.payload.node,
                  sessionIndex: event.payload.node.sessionIndex ?? sessionIndexRef.current
                };
                onStateChange((prev) => {
                  const filtered = prev.nodes.filter(n => n.id !== nodeWithSession.id);
                  return { nodes: [...filtered, nodeWithSession] };
                });

              } else if (event.type === 'edge_created' && event.payload.edge) {
                onStateChange((prev) => {
                  const filtered = prev.edges.filter(e => e.id !== event.payload.edge!.id);
                  return { edges: [...filtered, event.payload.edge!] };
                });

              } else if (event.type === 'thinking') {
                onStateChange((prev) => {
                  const nextStatuses = { ...prev.agentStatuses, [event.agentId]: 'thinking' as AgentStatus };
                  const nextThoughts = event.payload.text ? { ...prev.agentThoughts, [event.agentId]: event.payload.text } : prev.agentThoughts;
                  return { agentStatuses: nextStatuses, agentThoughts: nextThoughts };
                });

              } else if (event.type === 'streaming') {
                onStateChange((prev) => {
                  const currentThoughts = prev.agentThoughts[event.agentId] ?? '';
                  const nextThoughts = { ...prev.agentThoughts, [event.agentId]: currentThoughts + (event.payload.token || '') };
                  const nextStatuses = { ...prev.agentStatuses, [event.agentId]: 'streaming' as AgentStatus };
                  return { agentStatuses: nextStatuses, agentThoughts: nextThoughts };
                });

              } else if (event.type === 'complete') {
                onStateChange((prev) => {
                  const nextStatuses = { ...prev.agentStatuses, [event.agentId]: 'done' as AgentStatus };
                  const nextThoughts = event.payload.text ? { ...prev.agentThoughts, [event.agentId]: event.payload.text } : prev.agentThoughts;
                  return { agentStatuses: nextStatuses, agentThoughts: nextThoughts };
                });

              } else if (event.type === 'preprocessed') {
                if (event.payload.processedQuery) {
                  setProcessedQuery(event.payload.processedQuery as ClientProcessedQuery);
                }

              } else if (event.type === 'done') {
                onStateChange((prev) => {
                  const nextStatuses = { ...prev.agentStatuses };
                  for (const key in nextStatuses) {
                    nextStatuses[key] = 'done';
                  }
                  return {
                    structuredOutput: event.payload.text || '',
                    isRunning: false,
                    hasRun: true,
                    agentStatuses: nextStatuses
                  };
                });

                if (continuationTimeoutRef.current) {
                  clearTimeout(continuationTimeoutRef.current);
                }
                continuationTimeoutRef.current = setTimeout(() => {
                  setShowContinuation(true);
                }, 1500);

              } else if (event.type === 'error') {
                onStateChange((prev) => {
                  const nextStatuses = { ...prev.agentStatuses };
                  for (const key in nextStatuses) {
                    nextStatuses[key] = 'error';
                  }
                  return { isRunning: false, agentStatuses: nextStatuses };
                });
              }
            } catch (e) {
              console.error('Error parsing event JSON:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      onStateChange((prev) => {
        const nextStatuses = { ...prev.agentStatuses };
        for (const key in nextStatuses) {
          nextStatuses[key] = 'error';
        }
        return { isRunning: false, agentStatuses: nextStatuses };
      });
    } finally {
      activeReaderRef.current = null;
    }
  }, [mode, currentState.nodes, currentState.query, onStateChange]);

  const stopStream = useCallback(() => {
    if (activeReaderRef.current) {
      activeReaderRef.current.cancel().catch(err => console.error("Error stopping stream:", err));
      activeReaderRef.current = null;
    }
    onStateChange((prev) => {
      const nextStatuses = { ...prev.agentStatuses };
      for (const key in nextStatuses) {
        if (nextStatuses[key] === 'thinking' || nextStatuses[key] === 'responding' || nextStatuses[key] === 'streaming') {
          nextStatuses[key] = 'done';
        }
      }
      return { isRunning: false, agentStatuses: nextStatuses };
    });
  }, [onStateChange]);

  const restoreStream = useCallback((session: RestoreSessionData) => {
    onStateChange(() => ({
      query: session.query,
      nodes: session.nodes,
      edges: session.edges,
      structuredOutput: session.structuredOutput,
      agentThoughts: {},
      agentStatuses: {},
      isRunning: false,
      hasRun: true
    }));
    sessionIndexRef.current = 0;
    setProcessedQuery(null);
    setShowContinuation(true);
  }, [onStateChange]);

  const clearStream = useCallback(() => {
    onStateChange(() => ({
      query: '',
      nodes: [],
      edges: [],
      structuredOutput: null,
      agentThoughts: {},
      agentStatuses: {},
      isRunning: false,
      hasRun: false
    }));
    sessionIndexRef.current = 0;
    setProcessedQuery(null);
    setShowContinuation(false);
    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }
  }, [onStateChange]);

  const addNode = useCallback((node: GraphNode) => {
    onStateChange((prev) => {
      const filtered = prev.nodes.filter(n => n.id !== node.id);
      return { nodes: [...filtered, node] };
    });
  }, [onStateChange]);

  const addEdge = useCallback((edge: GraphEdge) => {
    onStateChange((prev) => {
      const filtered = prev.edges.filter(e => e.id !== edge.id);
      return { edges: [...filtered, edge] };
    });
  }, [onStateChange]);

  const lastQuery = currentState.query;
  const nodes = currentState.nodes;
  const edges = currentState.edges;
  const verdict = (currentState.structuredOutput as string) || '';
  const currentMode = mode;

  const saveSession = useCallback(() => {
    if (nodes.length === 0) return;
    
    const session = {
      id: 'session-' + Date.now(),
      query: lastQuery,
      mode: currentMode,
      nodes: nodes,
      edges: edges,
      verdict: verdict,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      timestamp: Date.now(),
      tldr: extractTLDR(verdict)
    };
    
    try {
      const existing = JSON.parse(
        localStorage.getItem('nx-sessions') || '[]'
      );
      const updated = [session, ...existing].slice(0, 10);
      localStorage.setItem('nx-sessions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Session save failed:', e);
    }
  }, [nodes, edges, verdict, lastQuery, currentMode]);

  const restoreSession = useCallback((data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    verdict: string;
    mode: NexusMode;
    query: string;
  }) => {
    onStateChange(() => ({
      query: data.query,
      nodes: data.nodes,
      edges: data.edges,
      structuredOutput: data.verdict,
      agentThoughts: {},
      agentStatuses: {},
      isRunning: false,
      hasRun: true
    }));
    sessionIndexRef.current = 0;
    setProcessedQuery(null);
    setShowContinuation(true);
  }, [onStateChange]);

  // Compute status
  let status: SessionStatus = 'idle';
  if (currentState.isRunning) {
    status = 'running';
  } else if (currentState.hasRun) {
    if (showContinuation) {
      status = 'ready_for_continuation';
    } else {
      status = 'complete';
    }
  } else {
    const hasError = Object.values(currentState.agentStatuses).some(s => s === 'error');
    if (hasError) {
      status = 'error';
    } else {
      status = 'idle';
    }
  }

  useEffect(() => {
    if (status === 'complete') {
      saveSession();
    }
  }, [status, saveSession]);

  // Compute activeAgents list
  const activeAgents = Object.entries(currentState.agentStatuses)
    .filter((entry) => entry[1] === 'thinking' || entry[1] === 'responding' || entry[1] === 'streaming')
    .map((entry) => entry[0] as AgentId);

  return {
    query: currentState.query,
    nodes: currentState.nodes,
    edges: currentState.edges,
    status,
    verdict: currentState.structuredOutput as string,
    activeAgents,
    processedQuery,
    agentThoughts: currentState.agentThoughts,
    startStream,
    stopStream,
    restoreStream,
    clearStream,
    addNode,
    addEdge,
    restoreSession,
    saveSession,
    isContinuationReady: showContinuation || (!currentState.isRunning && currentState.hasRun),
  };
}

function extractTLDR(verdict: string): string {
  if (!verdict) return 'No summary';
  try {
    const parsed = JSON.parse(
      verdict.replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    );
    if (parsed.tldr) return parsed.tldr;
  } catch {}
  // For non-JSON verdicts (debate/plan), first sentence
  return verdict.split('.')[0].slice(0, 60) + '...';
}
