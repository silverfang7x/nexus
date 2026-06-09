import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

export async function runProblemAgent(
  query: string,
  onEvent: (event: AgentEvent) => void,
  systemPromptPrefix?: string
): Promise<{ output: string; coreProblemNodeId: string }> {
  let systemPrompt = `You are a product strategy expert. Given an app idea, identify:
1. The core problem being solved (1 sentence)
2. The primary target user (1 sentence)  
3. The key pain point that makes this urgent (1 sentence)
4. One existing alternative and why it falls short (1 sentence)

Format as numbered list 1-4. Nothing else.`;

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
        agentId: 'advocate',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now(),
      });
    },
    (_full) => {
      onEvent({
        agentId: 'advocate',
        type: 'complete',
        payload: { text: _full },
        timestamp: Date.now(),
      });
    }
  );

  const lines = fullText.split('\n');
  const labels = ['Core Problem', 'Target User', 'Pain Point', 'Gap vs Existing'];
  let coreProblemNodeId = '';

  const emitPromises: Promise<void>[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) {
        const content = match[2].trim();
        const nodeId = crypto.randomUUID();
        const label = labels[num - 1] || 'Core Problem';

        if (num === 1) {
          coreProblemNodeId = nodeId;
        }

        emitPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'advocate',
                type: 'node_created',
                payload: {
                  node: {
                    id: nodeId,
                    type: 'feature',
                    label: label.slice(0, 28).replace(/\*\*/g, '').trim(),
                    content: content,
                    agentId: 'advocate',
                    timestamp: Date.now(),
                  },
                },
                timestamp: Date.now(),
              });
              resolve();
            }, (num - 1) * 300);
          })
        );
      }
    }
  }
  await Promise.all(emitPromises);

  return { output: fullText, coreProblemNodeId };
}
