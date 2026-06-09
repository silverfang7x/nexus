import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

export async function runStackAgent(
  query: string,
  onEvent: (event: AgentEvent) => void,
  coreProblemNodeId: string,
  systemPromptPrefix?: string
): Promise<string> {
  let systemPrompt = `You are a senior software architect. Given an app idea, 
recommend the optimal tech stack for a solo developer or 
small team shipping in 2 weeks.

List EXACTLY 5 technology choices:
1. Frontend framework
2. Backend/API approach
3. Database
4. Authentication
5. Deployment platform

Format: 
1. [Technology] — [one sentence why]
Only the list. Nothing else.`;

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
        agentId: 'codeanalyst',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now(),
      });
    },
    (_full) => {
      onEvent({
        agentId: 'codeanalyst',
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
      if (num >= 1 && num <= 5) {
        const item = match[2].trim();
        const parts = item.split(/[—–-]/);
        const techName = parts[0].trim();
        const nodeId = crypto.randomUUID();

        emitPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'codeanalyst',
                type: 'node_created',
                payload: {
                  node: {
                    id: nodeId,
                    type: 'milestone',
                    label: techName,
                    content: item,
                    agentId: 'codeanalyst',
                    timestamp: Date.now(),
                  },
                },
                timestamp: Date.now(),
              });

              if (coreProblemNodeId) {
                onEvent({
                  agentId: 'codeanalyst',
                  type: 'edge_created',
                  payload: {
                    edge: {
                      id: crypto.randomUUID(),
                      source: nodeId,
                      target: coreProblemNodeId,
                      type: 'depends',
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
