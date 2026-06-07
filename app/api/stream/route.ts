import { AgentEvent, NexusMode } from "@/types/nexus";
import { runDebateMode } from "@/lib/agents/orchestrator";
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
          if (mode === "debate") {
            await runDebateMode(query, send);
            send({
              agentId: "orchestrator",
              type: "done",
              payload: {},
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
      } catch (error: any) {
        send({
          agentId: "orchestrator",
          type: "error",
          payload: { error: error.message || String(error) },
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
        } catch (e) {
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
