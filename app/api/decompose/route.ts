import { AgentEvent } from "@/types/nexus";
import { decomposeMilestone } from "@/lib/agents/taskDecomposer";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.json();
  const { milestoneLabel, milestoneContent, projectContext, parentNodeId } = body as {
    milestoneLabel: string;
    milestoneContent: string;
    projectContext: string;
    parentNodeId: string;
  };

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
        await decomposeMilestone(
          milestoneLabel,
          milestoneContent,
          projectContext,
          (task, taskNodeId) => {
            // Emit node_created event
            send({
              agentId: "codeanalyst",
              type: "node_created",
              payload: {
                node: {
                  id: taskNodeId,
                  type: "task", // Use 'task' type to differentiate from milestone
                  label: `Day ${task.day}: ${task.title}`,
                  content: `${task.description}\n\nDeliverable: ${task.deliverable}\nTime: ${task.duration}`,
                  agentId: "codeanalyst",
                  confidence: 0.85,
                  timestamp: Date.now(),
                  parentId: parentNodeId
                }
              },
              timestamp: Date.now()
            });

            // Emit edge_created event linking task to parent milestone
            send({
              agentId: "codeanalyst",
              type: "edge_created",
              payload: {
                edge: {
                  id: crypto.randomUUID(),
                  source: taskNodeId,
                  target: parentNodeId,
                  type: "depends"
                }
              },
              timestamp: Date.now()
            });
          }
        );

        // Emit done event
        send({
          agentId: "orchestrator",
          type: "done",
          payload: { text: "Decomposition complete." },
          timestamp: Date.now()
        });

      } catch (error: unknown) {
        send({
          agentId: "orchestrator",
          type: "error",
          payload: { error: error instanceof Error ? error.message : String(error) },
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
