import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";
import crypto from 'crypto';

export async function runAdvocate(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  const systemPrompt = `You are the Advocate agent in a multi-agent debate system. 
Your ONLY job: make the strongest possible case FOR the given 
position or topic. 

RULES:
- Generate EXACTLY 4 arguments numbered 1 through 4
- Each argument: 1-2 sentences maximum, specific and bold
- No hedging. No 'however' or 'on the other hand'
- Format strictly as:
  1. [argument]
  2. [argument]  
  3. [argument]
  4. [argument]
- Nothing before the list. Nothing after the list.`;

  const response = await callAgent(systemPrompt, query);

  const lines = response.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) {
        const argument = match[2].trim();
        onEvent({
          agentId: 'advocate',
          type: 'node_created',
          payload: {
            node: {
              id: crypto.randomUUID(),
              type: 'claim',
              label: argument.slice(0, 28) + (argument.length > 28 ? '...' : ''),
              content: argument,
              agentId: 'advocate',
              confidence: 0.75,
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        });
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  return response;
}
