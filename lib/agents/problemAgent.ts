import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";
import crypto from 'crypto';

export async function runProblemAgent(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<{ output: string; coreProblemNodeId: string }> {
  const systemPrompt = `You are a product strategy expert. Given an app idea, identify:
1. The core problem being solved (1 sentence)
2. The primary target user (1 sentence)  
3. The key pain point that makes this urgent (1 sentence)
4. One existing alternative and why it falls short (1 sentence)

Format as numbered list 1-4. Nothing else.`;

  const response = await callAgent(systemPrompt, query);

  const lines = response.split("\n");
  const labels = ["Core Problem", "Target User", "Pain Point", "Gap vs Existing"];
  let coreProblemNodeId = "";

  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) {
        const content = match[2].trim();
        const nodeId = crypto.randomUUID();
        const label = labels[num - 1] || "Core Problem";
        
        if (num === 1) {
          coreProblemNodeId = nodeId;
        }

        onEvent({
          agentId: 'advocate',
          type: 'node_created',
          payload: {
            node: {
              id: nodeId,
              type: 'feature',
              label: label,
              content: content,
              agentId: 'advocate',
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        });

        // Staggered node emits for visual animation pacing
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  return { output: response, coreProblemNodeId };
}
