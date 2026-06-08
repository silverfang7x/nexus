import { AgentEvent, NexusMode } from "@/types/nexus";
import { runAdvocate } from "./advocate";
import { runChallenger } from "./challenger";
import { runSynthesizer } from "./synthesizer";

export function detectMode(query: string): NexusMode {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("github.com") || lowerQuery.includes("repo") || lowerQuery.includes("codebase")) {
    return "code";
  }
  if (lowerQuery.includes("build") || lowerQuery.includes("app") || lowerQuery.includes("startup") || lowerQuery.includes("project") || lowerQuery.includes("idea")) {
    return "plan";
  }
  if (lowerQuery.includes("research") || lowerQuery.includes("what is") || lowerQuery.includes("explain") || lowerQuery.includes("analyse")) {
    return "research";
  }
  return "debate";
}

export async function runDebateMode(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  // Round 1: Advocate
  onEvent({
    agentId: 'advocate',
    type: 'thinking',
    payload: { text: 'Building strongest case...' },
    timestamp: Date.now()
  });

  const advocateNodeIds: string[] = [];
  const trackingOnEvent = (event: AgentEvent) => {
    if (event.type === 'node_created' && event.payload.node) {
      advocateNodeIds.push(event.payload.node.id);
    }
    onEvent(event);
  };

  const advocateOutput = await runAdvocate(query, trackingOnEvent);

  // Round 2: Challenger (small delay for UX breathing room)
  await new Promise(r => setTimeout(r, 500));
  onEvent({
    agentId: 'challenger',
    type: 'thinking',
    payload: { text: 'Finding counter-arguments...' },
    timestamp: Date.now()
  });

  const challengerOutput = await runChallenger(advocateOutput, onEvent, advocateNodeIds);

  // Round 3: Synthesizer
  await new Promise(r => setTimeout(r, 500));
  const verdict = await runSynthesizer(advocateOutput, challengerOutput, query, onEvent);

  return verdict;
}
