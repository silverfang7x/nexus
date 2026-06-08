import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";

export async function runBlueprintSynthesizer(
  query: string,
  problemOutput: string,
  stackOutput: string,
  riskOutput: string,
  timelineOutput: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  const systemPrompt = `You are a technical advisor writing a project blueprint.
Synthesize the provided analysis into a 3-paragraph summary:

Para 1: What this product is and who it serves
Para 2: How to build it (stack and approach)
Para 3: What to watch out for and realistic timeline

Direct, specific, no filler. Separate with blank lines.`;

  onEvent({
    agentId: 'synthesizer',
    type: 'thinking',
    payload: { text: 'Synthesizing technical blueprint...' },
    timestamp: Date.now()
  });

  const userMessage = `App Idea: ${query}

Product Analysis:
${problemOutput}

Tech Stack Recommendation:
${stackOutput}

Risks identified:
${riskOutput}

Project Timeline:
${timelineOutput}`;

  const response = await callAgent(systemPrompt, userMessage);

  onEvent({
    agentId: 'synthesizer',
    type: 'message',
    payload: { text: response },
    timestamp: Date.now()
  });

  onEvent({
    agentId: 'synthesizer',
    type: 'done',
    payload: { text: response },
    timestamp: Date.now()
  });

  return response;
}
