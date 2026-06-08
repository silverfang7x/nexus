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
Respond with ONLY valid JSON — no markdown fences, no preamble, no trailing text.

Output this exact schema:
{
  "tldr": "one sentence summary of the app concept",
  "problem": "the core user problem this app solves in one sentence",
  "stack": {
    "frontend": "recommended frontend framework/tech",
    "backend": "recommended backend framework/tech",
    "database": "recommended database",
    "hosting": "recommended hosting platform"
  },
  "features": ["core feature 1", "core feature 2", "core feature 3", "core feature 4"],
  "risks": ["biggest risk 1", "biggest risk 2", "biggest risk 3"],
  "timeline": [
    {"week": 1, "milestone": "milestone description"},
    {"week": 2, "milestone": "milestone description"},
    {"week": 4, "milestone": "milestone description"},
    {"week": 8, "milestone": "milestone description"},
    {"week": 12, "milestone": "milestone description"}
  ],
  "verdict": "overall assessment: is this idea viable and what is the key success factor"
}

Rules:
- "tldr" must be one sentence under 20 words
- "features" must have 3-5 items, each under 10 words
- "risks" must have 2-4 items, each under 15 words
- "timeline" must have exactly 5 weeks (choose realistic ones)
- All tech names in "stack" must be real, specific technologies
- Output ONLY the JSON object, nothing else`;

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

  const raw = await callAgent(systemPrompt, userMessage);
  const verdictText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  onEvent({
    agentId: 'synthesizer',
    type: 'message',
    payload: { text: verdictText },
    timestamp: Date.now()
  });

  onEvent({
    agentId: 'synthesizer',
    type: 'done',
    payload: { text: verdictText },
    timestamp: Date.now()
  });

  return verdictText;
}
