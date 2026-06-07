import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";

export async function runSynthesizer(fullContext: string, onEvent?: (e: AgentEvent) => void): Promise<string> {
  const systemPrompt = "You are the Synthesizer. Read the full debate and write a balanced 3-paragraph verdict: (1) strongest arguments FOR, (2) strongest arguments AGAINST, (3) your balanced conclusion. Be direct.";

  if (onEvent) {
    onEvent({
      agentId: "synthesizer",
      type: "thinking",
      payload: { text: "Synthesizer is evaluating the debate..." },
      timestamp: Date.now()
    });
  }

  const response = await callAgent(systemPrompt, fullContext);

  if (onEvent) {
    onEvent({
      agentId: "synthesizer",
      type: "message",
      payload: { text: response },
      timestamp: Date.now()
    });
  }

  return response;
}
