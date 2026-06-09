import { useState, useCallback, useRef, useEffect } from "react";
import { AgentEvent, GraphEdge, GraphNode, NexusMode, AgentId } from "@/types/nexus";

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

export function useAgentStream() {
  const [query, setQuery] = useState<string>('');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [verdict, setVerdict] = useState<string>('');
  const [activeAgents, setActiveAgents] = useState<AgentId[]>([]);
  const [processedQuery, setProcessedQuery] = useState<ClientProcessedQuery | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [currentMode, setCurrentMode] = useState<NexusMode>('debate');

  const sessionIndexRef = useRef(0);
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * agentThoughts: per-agent accumulated streaming text.
   * Key = agentId, Value = the text currently being typed out character-by-character.
   */
  const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (continuationTimeoutRef.current) {
        clearTimeout(continuationTimeoutRef.current);
      }
    };
  }, []);

  const startSession = useCallback(async (mode: NexusMode, query: string, useMock = false, isContinuation = false) => {
    setQuery(query);
    setCurrentMode(mode);
    setLastQuery(query);

    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }

    if (!isContinuation) {
      setNodes([]);
      setEdges([]);
      setEvents([]);
      setVerdict('');
      setAgentThoughts({});
      sessionIndexRef.current = 0;
    } else {
      setAgentThoughts({});
      sessionIndexRef.current += 1;
    }

    setStatus('running');
    setActiveAgents([]);
    setProcessedQuery(null);

    try {
      const continuationContext = isContinuation ? {
        existingNodes: nodes,
        previousQuery: lastQuery,
        mode: currentMode
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

              setEvents((prev) => [...prev, event]);

              if (event.type === 'node_created' && event.payload.node) {
                const nodeWithSession = {
                  ...event.payload.node,
                  sessionIndex: event.payload.node.sessionIndex ?? sessionIndexRef.current
                };
                setNodes((prev) => {
                  const filtered = prev.filter(n => n.id !== nodeWithSession.id);
                  return [...filtered, nodeWithSession];
                });

              } else if (event.type === 'edge_created' && event.payload.edge) {
                setEdges((prev) => {
                  const filtered = prev.filter(e => e.id !== event.payload.edge!.id);
                  return [...filtered, event.payload.edge!];
                });

              } else if (event.type === 'thinking') {
                setActiveAgents((prev) => {
                  if (!prev.includes(event.agentId)) {
                    return [...prev, event.agentId];
                  }
                  return prev;
                });
                if (event.payload.text) {
                  setAgentThoughts((prev) => ({
                    ...prev,
                    [event.agentId]: event.payload.text!,
                  }));
                }

              } else if (event.type === 'streaming') {
                if (event.payload.token) {
                  setAgentThoughts((prev) => ({
                    ...prev,
                    [event.agentId]: (prev[event.agentId] ?? '') + event.payload.token!,
                  }));
                }
                setActiveAgents((prev) => {
                  if (!prev.includes(event.agentId)) {
                    return [...prev, event.agentId];
                  }
                  return prev;
                });

              } else if (event.type === 'complete') {
                if (event.payload.text) {
                  setAgentThoughts((prev) => ({
                    ...prev,
                    [event.agentId]: event.payload.text!,
                  }));
                }

              } else if (event.type === 'preprocessed') {
                if (event.payload.processedQuery) {
                  setProcessedQuery(event.payload.processedQuery as ClientProcessedQuery);
                }

              } else if (event.type === 'done') {
                if (event.payload.text) {
                  setVerdict(event.payload.text);
                }
                setStatus('complete');
                setActiveAgents([]);

                if (continuationTimeoutRef.current) {
                  clearTimeout(continuationTimeoutRef.current);
                }
                continuationTimeoutRef.current = setTimeout(() => {
                  setStatus('ready_for_continuation');
                }, 1500);

              } else if (event.type === 'error') {
                setStatus('error');
              }
            } catch (e) {
              console.error('Error parsing event JSON:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      setStatus('error');
    }
  }, [nodes, lastQuery, currentMode]);

  const restoreSession = useCallback((session: RestoreSessionData) => {
    setQuery(session.query);
    setNodes(session.nodes);
    setEdges(session.edges);
    setVerdict(session.structuredOutput as string);
    setStatus('complete');
    setActiveAgents([]);
    setAgentThoughts({});
    setLastQuery(session.query);
    setCurrentMode(session.mode);
    sessionIndexRef.current = 0;

    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
    }
    continuationTimeoutRef.current = setTimeout(() => {
      setStatus('ready_for_continuation');
    }, 1500);

    if (session.cleanQuery) {
      setProcessedQuery({
        cleanQuery: session.cleanQuery,
        detectedMode: session.mode,
        modeConfidence: 1.0,
        intent: 'restored',
        domain: 'restored',
        entities: [],
        wasAmbiguous: false,
        originalQuery: session.query,
        enrichedQuery: session.query
      });
    } else {
      setProcessedQuery(null);
    }
  }, []);

  const clearSession = useCallback(() => {
    setQuery('');
    setNodes([]);
    setEdges([]);
    setEvents([]);
    setStatus('idle');
    setVerdict('');
    setActiveAgents([]);
    setProcessedQuery(null);
    setAgentThoughts({});
    setLastQuery('');
    sessionIndexRef.current = 0;
    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }
  }, []);

  const addNode = useCallback((node: GraphNode) => {
    setNodes((prev) => {
      const filtered = prev.filter(n => n.id !== node.id);
      return [...filtered, node];
    });
  }, []);

  const addEdge = useCallback((edge: GraphEdge) => {
    setEdges((prev) => {
      const filtered = prev.filter(e => e.id !== edge.id);
      return [...filtered, edge];
    });
  }, []);

  return {
    query,
    nodes,
    edges,
    events,
    status,
    verdict,
    activeAgents,
    processedQuery,
    agentThoughts,
    startSession,
    restoreSession,
    addNode,
    addEdge,
    clearSession,
    isContinuationReady: status === 'ready_for_continuation' || status === 'complete',
    currentSessionSummary: {
      nodeCount: nodes.length,
      nodeSummaries: nodes
        .filter(n => ['feature','milestone','claim'].includes(n.type))
        .slice(0, 8)
        .map(n => n.label + ': ' + n.content.slice(0, 60)),
      previousQuery: lastQuery,
      mode: currentMode
    }
  };
}
