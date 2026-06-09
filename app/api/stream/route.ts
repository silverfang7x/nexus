import { AgentEvent, NexusMode, GraphNode } from "@/types/nexus";
import { runDebateMode, runPlanMode, runResearchMode } from "@/lib/agents/orchestrator";
import { runCodeMode } from "@/lib/agents/codeanalyst";
import { preprocessQuery } from "@/lib/queryPreprocessor";
import * as fs from "fs";
import * as path from "path";
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.json();
  const { mode, query, useMock, continuationContext } = body as {
    mode: NexusMode;
    query: string;
    useMock?: boolean;
    continuationContext?: {
      existingNodes: GraphNode[];
      previousQuery: string;
      mode: NexusMode;
    };
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const createdNodesInThisRun: GraphNode[] = [];

      function send(event: AgentEvent) {
        try {
          if (event.type === 'node_created' && event.payload.node) {
            createdNodesInThisRun.push(event.payload.node);
          }
          controller.enqueue(encoder.encode("data: " + JSON.stringify(event) + "\n\n"));

          // Scan content for connection patterns if in continuation mode
          if (continuationContext && event.type === 'node_created' && event.payload.node) {
            const node = event.payload.node;
            const regex = /(?:CONNECTS_TO|EXTENDS):\s*\[(.*?)\]/gi;
            let match;
            while ((match = regex.exec(node.content)) !== null) {
              const targetLabel = match[1].trim();
              const targetNode = continuationContext.existingNodes.find(
                n => n.label.toLowerCase() === targetLabel.toLowerCase()
              ) || createdNodesInThisRun.find(
                n => n.id !== node.id && n.label.toLowerCase() === targetLabel.toLowerCase()
              );

              if (targetNode) {
                const edgeEvent: AgentEvent = {
                  agentId: event.agentId,
                  type: 'edge_created',
                  payload: {
                    edge: {
                      id: crypto.randomUUID(),
                      source: node.id,
                      target: targetNode.id,
                      type: 'links',
                      label: 'extends'
                    }
                  },
                  timestamp: Date.now()
                };
                controller.enqueue(encoder.encode("data: " + JSON.stringify(edgeEvent) + "\n\n"));
              }
            }
          }
        } catch (e) {
          console.error("Error enqueuing event", e);
        }
      }

      try {
        if (useMock) {
          const mockPath = path.join(process.cwd(), "mock", mode + "-sample.json");
          if (fs.existsSync(mockPath)) {
            const fileContent = fs.readFileSync(mockPath, "utf8");
            const mockData = JSON.parse(fileContent) as AgentEvent[];
            
            for (const event of mockData) {
              send(event);
              await new Promise(resolve => setTimeout(resolve, 400));
            }
          } else {
            send({
              agentId: "orchestrator",
              type: "error",
              payload: { error: "Mock file not found for mode: " + mode },
              timestamp: Date.now()
            });
            send({
              agentId: "orchestrator",
              type: "done",
              payload: {},
              timestamp: Date.now()
            });
          }
        } else {
          // ── STEP 1: Preprocess the query ─────────────────────────────────
          let existingContext = undefined;
          if (continuationContext) {
            existingContext = {
              nodeCount: continuationContext.existingNodes.length,
              nodeSummaries: continuationContext.existingNodes
                .filter(n => ['feature','milestone','claim'].includes(n.type))
                .slice(0, 8)
                .map(n => n.label + ': ' + n.content.slice(0, 60)),
              previousQuery: continuationContext.previousQuery,
              mode: continuationContext.mode
            };
          }

          const processed = await preprocessQuery(query, mode, existingContext);

          // Emit a preprocessed event so the UI can show "NEXUS UNDERSTOOD"
          send({
            agentId: "orchestrator",
            type: "preprocessed",
            payload: {
              text: processed.cleanQuery,
              processedQuery: {
                cleanQuery: processed.cleanQuery,
                detectedMode: processed.detectedMode,
                modeConfidence: processed.modeConfidence,
                intent: processed.intent,
                domain: processed.domain,
                entities: processed.entities,
                wasAmbiguous: processed.wasAmbiguous,
                originalQuery: processed.originalQuery,
                enrichedQuery: processed.enrichedQuery,
                isContinuation: processed.isContinuation,
                continuationInstruction: processed.continuationInstruction,
              },
            },
            timestamp: Date.now()
          });

          // Use the enriched query for all agents
          const enriched = processed.enrichedQuery;

          // ── STEP 2: Route to the correct mode ──────────────────────────
          if (mode === "debate") {
            const verdict = await runDebateMode(enriched, send);
            send({
              agentId: "orchestrator",
              type: "done",
              payload: { text: verdict },
              timestamp: Date.now()
            });
          } else if (mode === "plan") {
            let runPlanContinuationContext = undefined;
            if (processed.isContinuation && continuationContext) {
              runPlanContinuationContext = {
                existingNodes: continuationContext.existingNodes,
                instruction: processed.continuationInstruction
              };
            }

            const verdict = await runPlanMode(enriched, send, runPlanContinuationContext);
            send({
              agentId: "orchestrator",
              type: "done",
              payload: { text: verdict },
              timestamp: Date.now()
            });
          } else if (mode === "research") {
            const verdict = await runResearchMode(enriched, send);
            send({
              agentId: "orchestrator",
              type: "done",
              payload: { text: verdict },
              timestamp: Date.now()
            });
          } else if (mode === "code") {
            const verdict = await runCodeMode(enriched, send);
            send({
              agentId: "orchestrator",
              type: "done",
              payload: { text: verdict },
              timestamp: Date.now()
            });
          } else {
            send({
              agentId: "orchestrator",
              type: "done",
              payload: { text: "coming soon" },
              timestamp: Date.now()
            });
          }
        }
      } catch (error: unknown) {
        send({
          agentId: "orchestrator",
          type: "error",
          payload: { error: error instanceof Error ? error.message : String(error) },
          timestamp: Date.now()
        });
        send({
          agentId: "orchestrator",
          type: "done",
          payload: {},
          timestamp: Date.now()
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
