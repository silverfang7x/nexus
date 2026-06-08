import { useState, useCallback } from "react";
import { AgentEvent, GraphEdge, GraphNode, NexusMode, NexusSession, AgentId } from "@/types/nexus";

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

export function useAgentStream() {
  const [query, setQuery] = useState<string>('');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<NexusSession['status']>('idle');
  const [verdict, setVerdict] = useState<string>('');
  const [activeAgents, setActiveAgents] = useState<AgentId[]>([]);
  const [processedQuery, setProcessedQuery] = useState<ClientProcessedQuery | null>(null);

  /**
   * agentThoughts: per-agent accumulated streaming text.
   * Key = agentId, Value = the text currently being typed out character-by-character.
   */
  const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({});

  const startSession = useCallback(async (mode: NexusMode, query: string, useMock = false) => {
    setQuery(query);
    setNodes([]);
    setEdges([]);
    setEvents([]);
    setStatus('running');
    setVerdict('');
    setActiveAgents([]);
    setProcessedQuery(null);
    setAgentThoughts({});

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode, query, useMock }),
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
                setNodes((prev) => {
                  const filtered = prev.filter(n => n.id !== event.payload.node!.id);
                  return [...filtered, event.payload.node!];
                });

              } else if (event.type === 'edge_created' && event.payload.edge) {
                setEdges((prev) => {
                  const filtered = prev.filter(e => e.id !== event.payload.edge!.id);
                  return [...filtered, event.payload.edge!];
                });

              } else if (event.type === 'thinking') {
                // 'thinking' event: replace the agent's thought text with the status message
                // and add the agent to the activeAgents list
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
                // 'streaming' event: APPEND the token to the agent's accumulated text
                // This creates the typewriter character-by-character effect
                if (event.payload.token) {
                  setAgentThoughts((prev) => ({
                    ...prev,
                    [event.agentId]: (prev[event.agentId] ?? '') + event.payload.token!,
                  }));
                }
                // Ensure the agent is in activeAgents
                setActiveAgents((prev) => {
                  if (!prev.includes(event.agentId)) {
                    return [...prev, event.agentId];
                  }
                  return prev;
                });

              } else if (event.type === 'complete') {
                // 'complete' event: stream finished for this agent — keep text, mark done
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

              } else if (event.type === 'error') {
                setStatus('error');
              }
              // note: 'message' events are already captured by appending to events array
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
  };
}
