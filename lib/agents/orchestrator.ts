import { AgentEvent, NexusMode } from "@/types/nexus";
import { runAdvocate } from "./advocate";
import { runChallenger } from "./challenger";
import { runSynthesizer } from "./synthesizer";
import { runProblemAgent } from "./problemAgent";
import { runStackAgent } from "./stackAgent";
import { runRiskAgent } from "./riskAgent";
import { runTimelineAgent } from "./timelineAgent";
import { runBlueprintSynthesizer } from "./blueprintSynthesizer";

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

export async function runPlanMode(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  // 1. problemAgent
  onEvent({
    agentId: 'advocate',
    type: 'thinking',
    payload: { text: 'Analyzing app concept and core problem...' },
    timestamp: Date.now()
  });
  const problemResult = await runProblemAgent(query, onEvent);
  
  // 2. stackAgent (with 400ms delay)
  await new Promise(r => setTimeout(r, 400));
  onEvent({
    agentId: 'codeanalyst',
    type: 'thinking',
    payload: { text: 'Architecting optimal stack and connections...' },
    timestamp: Date.now()
  });
  const stackOutput = await runStackAgent(query, onEvent, problemResult.coreProblemNodeId);

  // 3. riskAgent (with 400ms delay)
  await new Promise(r => setTimeout(r, 400));
  onEvent({
    agentId: 'challenger',
    type: 'thinking',
    payload: { text: 'Identifying startup and project risks...' },
    timestamp: Date.now()
  });
  const riskOutput = await runRiskAgent(query, onEvent, problemResult.coreProblemNodeId);

  // 4. timelineAgent (with 400ms delay)
  await new Promise(r => setTimeout(r, 400));
  onEvent({
    agentId: 'synthesizer',
    type: 'thinking',
    payload: { text: 'Drafting milestone timeline...' },
    timestamp: Date.now()
  });
  const timelineOutput = await runTimelineAgent(query, onEvent);

  // 5. blueprintSynthesizer (with 400ms delay)
  await new Promise(r => setTimeout(r, 400));
  const blueprint = await runBlueprintSynthesizer(
    query,
    problemResult.output,
    stackOutput,
    riskOutput,
    timelineOutput,
    onEvent
  );

  return blueprint;
}
