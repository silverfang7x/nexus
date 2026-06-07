import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";

export async function runChallenger(advocateClaims: string, onEvent?: (e: AgentEvent) => void): Promise<string> {
  const systemPrompt = "You are the Challenger. Your ONLY job is to find the strongest counter-argument to each claim. For each numbered claim provided, write a numbered rebuttal. Be direct and critical.";

  if (onEvent) {
    onEvent({
      agentId: "challenger",
      type: "thinking",
      payload: { text: "Challenger is analyzing claims..." },
      timestamp: Date.now()
    });
  }

  const response = await callAgent(systemPrompt, advocateClaims);

  if (onEvent) {
    const lines = response.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\.\s+(.*)/);
      if (match) {
        const index = match[1];
        const rebuttalId = "rebuttal-" + index;
        const targetClaimId = "claim-" + index;
        
        onEvent({
          agentId: "challenger",
          type: "node_created",
          payload: {
            node: {
              id: rebuttalId,
              type: "rebuttal",
              label: "Rebuttal " + index,
              content: match[2].trim(),
              agentId: "challenger",
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        });

        onEvent({
          agentId: "challenger",
          type: "edge_created",
          payload: {
            edge: {
              id: "edge-rebuts-" + index,
              source: rebuttalId,
              target: targetClaimId,
              type: "rebuts"
            }
          },
          timestamp: Date.now()
        });
      }
    }
  }

  return response;
}
