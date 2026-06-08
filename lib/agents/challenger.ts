import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";
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
  const response = await callAgent(systemPrompt, userMessage);

  const lines = response.split("\n");


  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) {
        const rebuttal = match[2].trim();
        const rebuttalNodeId = crypto.randomUUID();

        // Emit node_created for rebuttal
        onEvent({
          agentId: 'challenger',
          type: 'node_created',
          payload: {
            node: {
              id: rebuttalNodeId,
              type: 'rebuttal',
              label: rebuttal.slice(0, 28) + (rebuttal.length > 28 ? '...' : ''),
              content: rebuttal,
              agentId: 'challenger',
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        });

        // Emit edge_created linking rebuttal to advocate node
        const targetId = advocateNodeIds[num - 1] || 'claim-' + num;
        onEvent({
          agentId: 'challenger',
          type: 'edge_created',
          payload: {
            edge: {
              id: crypto.randomUUID(),
              source: rebuttalNodeId,
              target: targetId,
              type: 'rebuts'
            }
          },
          timestamp: Date.now()
        });


        // Add 300ms delay between each node/edge pair emit
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  return response;
}
