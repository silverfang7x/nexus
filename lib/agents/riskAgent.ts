import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";
import crypto from 'crypto';

export async function runRiskAgent(
  query: string,
  onEvent: (event: AgentEvent) => void,
  coreProblemNodeId: string
): Promise<string> {
  const systemPrompt = `You are a startup advisor. Given this app idea, identify 
the 3 biggest risks that could kill this project.

Format:
1. [Risk name]: [one sentence description]
2. [Risk name]: [one sentence description]
3. [Risk name]: [one sentence description]

Only the list.`;

  const response = await callAgent(systemPrompt, query);

  const lines = response.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 3) {
        const item = match[2].trim();
        const parts = item.split(":");
        const riskName = parts[0].trim();
        const nodeId = crypto.randomUUID();

        onEvent({
          agentId: 'challenger',
          type: 'node_created',
          payload: {
            node: {
              id: nodeId,
              type: 'risk',
              label: riskName,
              content: item,
              agentId: 'challenger',
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
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
                type: 'links'
              }
            },
            timestamp: Date.now()
          });
        }

        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  return response;
}
