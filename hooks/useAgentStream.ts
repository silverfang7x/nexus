import { useState, useRef, useEffect } from "react";
import { AgentEvent, GraphEdge, GraphNode, NexusMode, NexusSession, AgentId } from "@/types/nexus";

export function useAgentStream() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<NexusSession['status']>('idle');
  const [verdict, setVerdict] = useState<string>('');
  const [activeAgents, setActiveAgents] = useState<AgentId[]>([]);

  const startSession = async (mode: NexusMode, query: string, useMock = false) => {
    setNodes([]);
    setEdges([]);
    setEvents([]);
    setStatus('running');
    setVerdict('');
    setActiveAgents([]);

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
                setNodes((prev) => [...prev, event.payload.node!]);
              } else if (event.type === 'edge_created' && event.payload.edge) {
                setEdges((prev) => [...prev, event.payload.edge!]);
              } else if (event.type === 'thinking') {
                setActiveAgents((prev) => {
                  if (!prev.includes(event.agentId)) {
                    return [...prev, event.agentId];
                  }
                  return prev;
                });
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
  };

  return { nodes, edges, events, status, verdict, activeAgents, startSession };
}
