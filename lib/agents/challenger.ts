import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

export async function runChallenger(
  advocateOutput: string,
  onEvent: (event: AgentEvent) => void,
  advocateNodeIds: string[]
): Promise<string> {
  const systemPrompt = `You are the Challenger agent. Your ONLY job: find the 
strongest counter-argument to each of the 4 arguments given.

RULES:
- Respond with EXACTLY 4 rebuttals, numbered 1-4
- Each rebuttal directly attacks the corresponding argument
- Be specific, cite real-world examples or data where possible
- Format strictly as:
  1. [rebuttal]
  2. [rebuttal]
  3. [rebuttal]
  4. [rebuttal]
- Nothing before. Nothing after.`;

  const userMessage = "Here are the arguments to rebut:\n" + advocateOutput;
  let fullText = '';

  await streamGroqResponse(
    systemPrompt,
    userMessage,
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

  // Parse and emit graph nodes + edges
  const lines = fullText.split('\n');
  const emitPromises: Promise<void>[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) {
        const rebuttal = match[2].trim();
        const rebuttalNodeId = crypto.randomUUID();
        const targetId = advocateNodeIds[num - 1] || 'claim-' + num;

        emitPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'challenger',
                type: 'node_created',
                payload: {
                  node: {
                    id: rebuttalNodeId,
                    type: 'rebuttal',
                    label: rebuttal.slice(0, 28).replace(/\*\*/g, '').trim(),
                    content: rebuttal,
                    agentId: 'challenger',
                    timestamp: Date.now(),
                  },
                },
                timestamp: Date.now(),
              });
              onEvent({
                agentId: 'challenger',
                type: 'edge_created',
                payload: {
                  edge: {
                    id: crypto.randomUUID(),
                    source: rebuttalNodeId,
                    target: targetId,
                    type: 'rebuts',
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

  return fullText;
}
