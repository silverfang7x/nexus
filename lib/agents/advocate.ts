import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";

export async function runAdvocate(query: string, context?: string, onEvent?: (e: AgentEvent) => void): Promise<string> {
  const systemPrompt = "You are the Advocate agent. Your ONLY job is to make the strongest possible case FOR the given position. Generate exactly 4 numbered claims, each 1-2 sentences. Format: 1. [claim] 2. [claim] 3. [claim] 4. [claim]. Be specific, cite reasoning, do not hedge.";
  
  let userMessage = query;
  if (context) {
    userMessage += "\n\nContext to address:\n" + context;
  }

  if (onEvent) {
    onEvent({
      agentId: "advocate",
      type: "thinking",
      payload: { text: "Advocate is formulating claims..." },
      timestamp: Date.now()
    });
  }

  const response = await callAgent(systemPrompt, userMessage);

  if (onEvent) {
    const lines = response.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\.\s+(.*)/);
      if (match) {
        const index = match[1];
        const idPrefix = context ? "refined-claim" : "claim";
        onEvent({
          agentId: "advocate",
          type: "node_created",
          payload: {
            node: {
              id: idPrefix + "-" + index,
              type: "claim",
              label: "Claim " + index,
              content: match[2].trim(),
              agentId: "advocate",
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        });
      }
    }
  }

  return response;
}
