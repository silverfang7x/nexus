import { AgentEvent } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";

export async function runSynthesizer(
  advocateOutput: string,
  challengerOutput: string,
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  const systemPrompt = `You are the Synthesizer agent. You have observed a structured 
debate and must now write a balanced, insightful verdict.

Write EXACTLY 3 paragraphs:
Paragraph 1: The strongest case FOR (based on the advocate arguments)
Paragraph 2: The strongest case AGAINST (based on the challenger rebuttals)  
Paragraph 3: Your balanced conclusion — what is actually true, nuanced, 
and useful for someone trying to understand this topic

Each paragraph: 3-4 sentences. Direct, no filler phrases.
Separate paragraphs with a blank line.
Do not label the paragraphs.`;

  onEvent({ 
    agentId: 'synthesizer', 
    type: 'thinking', 
    payload: { text: 'Synthesizing debate...' }, 
    timestamp: Date.now() 
  });

  const userMessage = `Query: ${query}\n\nAdvocate Output:\n${advocateOutput}\n\nChallenger Output:\n${challengerOutput}`;
  const verdictText = await callAgent(systemPrompt, userMessage);

  onEvent({ 
    agentId: 'synthesizer', 
    type: 'message',
    payload: { text: verdictText }, 
    timestamp: Date.now() 
  });

  onEvent({
    agentId: 'synthesizer',
    type: 'done',
    payload: { text: 'Synthesis complete.' },
    timestamp: Date.now()
  });

  return verdictText;
}
