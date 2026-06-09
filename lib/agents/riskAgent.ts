import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

export async function runRiskAgent(
  query: string,
  onEvent: (event: AgentEvent) => void,
  coreProblemNodeId: string,
  systemPromptPrefix?: string
): Promise<string> {
  let systemPrompt = `You are a startup advisor. Given this app idea, identify 
the 3 biggest risks that could kill this project.

Format:
1. [Risk name]: [one sentence description]
2. [Risk name]: [one sentence description]
3. [Risk name]: [one sentence description]

Only the list.`;

  if (systemPromptPrefix) {
    systemPrompt = `${systemPromptPrefix}\n\n${systemPrompt}`;
  }

  let fullText = '';

  await streamGroqResponse(
    systemPrompt,
    query,
    (token) => {
      fullText += token;
      onEvent({
        agentId: 'challenger',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now(),
      });
    },
    (_full) => {
      onEvent({
        agentId: 'challenger',
        type: 'complete',
        payload: { text: _full },
        timestamp: Date.now(),
      });
    }
  );

  const lines = fullText.split('\n');
  const emitPromises: Promise<void>[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 3) {
        const item = match[2].trim();
        const parts = item.split(':');
        const riskName = parts[0].trim();
        const nodeId = crypto.randomUUID();

        emitPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'challenger',
                type: 'node_created',
                payload: {
                  node: {
                    id: nodeId,
                    type: 'risk',
                    label: riskName.slice(0, 28).replace(/\*\*/g, '').trim(),
                    content: item,
                    agentId: 'challenger',
                    timestamp: Date.now(),
                  },
                },
                timestamp: Date.now(),
              });

              if (coreProblemNodeId) {
                onEvent({
                  agentId: 'challenger',
                  type: 'edge_created',
                  payload: {
                    edge: {
                      id: crypto.randomUUID(),
                      source: nodeId,
                      target: coreProblemNodeId,
                      type: 'links',
                    },
                  },
                  timestamp: Date.now(),
                });
              }
              resolve();
            }, (num - 1) * 300);
          })
        );
      }
    }
  }
  await Promise.all(emitPromises);

  return fullText;
}
