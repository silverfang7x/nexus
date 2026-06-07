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

export async function runDebateMode(query: string, onEvent: (event: AgentEvent) => void): Promise<string> {
  // Round 1
  onEvent({
    agentId: "orchestrator",
    type: "thinking",
    payload: { text: "Starting Round 1: Calling Advocate..." },
    timestamp: Date.now()
  });
  const advocateClaims = await runAdvocate(query, undefined, onEvent);

  // Round 2
  onEvent({
    agentId: "orchestrator",
    type: "thinking",
    payload: { text: "Starting Round 2: Calling Challenger..." },
    timestamp: Date.now()
  });
  const challengerRebuttals = await runChallenger(advocateClaims, onEvent);

  // Round 3
  onEvent({
    agentId: "orchestrator",
    type: "thinking",
    payload: { text: "Starting Round 3: Advocate refining claims..." },
    timestamp: Date.now()
  });
  const refinedClaims = await runAdvocate(query, challengerRebuttals, onEvent);

  // Round 4
  onEvent({
    agentId: "orchestrator",
    type: "thinking",
    payload: { text: "Starting Round 4: Synthesizer forming verdict..." },
    timestamp: Date.now()
  });
  const fullContext = "Query: " + query + "\n\nAdvocate Initial Claims:\n" + advocateClaims + "\n\nChallenger Rebuttals:\n" + challengerRebuttals + "\n\nAdvocate Refined Claims:\n" + refinedClaims;
  const verdict = await runSynthesizer(fullContext, onEvent);

  onEvent({
    agentId: "orchestrator",
    type: "done",
    payload: { text: "Debate concluded." },
    timestamp: Date.now()
  });

  return verdict;
}
