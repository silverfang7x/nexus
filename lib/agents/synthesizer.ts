import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";

export async function runSynthesizer(
  advocateOutput: string,
  challengerOutput: string,
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  const systemPrompt = `You are the Synthesizer agent. You have observed a structured debate.
Respond with ONLY valid JSON — no markdown fences, no preamble, no trailing text.

Output this exact schema:
{
  "tldr": "one sentence summary of the core debate",
  "for": ["strongest point 1 in favour", "strongest point 2 in favour", "strongest point 3 in favour"],
  "against": ["strongest counter-point 1", "strongest counter-point 2", "strongest counter-point 3"],
  "verdict": "your balanced, nuanced conclusion in 2-3 sentences",
  "confidence": 0.75
}

Rules:
- "tldr" must be a single sentence under 20 words
- "for" and "against" must each have 3 items, each under 15 words
- "confidence" is a float 0.0–1.0 reflecting how clear-cut the answer is
- "verdict" is 2-3 sentences, direct and useful
- Output ONLY the JSON object, nothing else`;

  onEvent({
    agentId: 'synthesizer',
    type: 'thinking',
    payload: { text: 'Synthesizing debate into structured verdict...' },
    timestamp: Date.now(),
  });

  const userMessage = `Query: ${query}\n\nAdvocate Output:\n${advocateOutput}\n\nChallenger Output:\n${challengerOutput}`;
  let fullText = '';

  await streamGroqResponse(
    systemPrompt,
    userMessage,
    (token) => {
      fullText += token;
      onEvent({
        agentId: 'synthesizer',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now(),
      });
    },
    (_full) => {
      onEvent({
        agentId: 'synthesizer',
        type: 'complete',
        payload: { text: _full },
        timestamp: Date.now(),
      });
    }
  );

  // Strip any accidental markdown fences the model might still emit
  const verdictText = fullText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  onEvent({
    agentId: 'synthesizer',
    type: 'message',
    payload: { text: verdictText },
    timestamp: Date.now(),
  });

  onEvent({
    agentId: 'synthesizer',
    type: 'done',
    payload: { text: verdictText },
    timestamp: Date.now(),
  });

  return verdictText;
}
