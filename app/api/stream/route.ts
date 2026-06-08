import { AgentEvent, NexusMode } from "@/types/nexus";
import { runDebateMode, runPlanMode, runResearchMode } from "@/lib/agents/orchestrator";
import { runCodeMode } from "@/lib/agents/codeanalyst";
import { preprocessQuery } from "@/lib/queryPreprocessor";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: Request) {
  const body = await request.json();
  const { mode, query, useMock } = body as { mode: NexusMode; query: string; useMock?: boolean };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: AgentEvent) {
        try {
          controller.enqueue(encoder.encode("data: " + JSON.stringify(event) + "\n\n"));
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
          const processed = await preprocessQuery(query, mode);

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
            const verdict = await runPlanMode(enriched, send);
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
