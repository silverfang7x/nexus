import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

export async function runTimelineAgent(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  const systemPrompt = `You are a project manager. Create a 4-week build timeline 
for this app idea. One milestone per week.

Format:
Week 1: [milestone title] — [one sentence description]
Week 2: [milestone title] — [one sentence]
Week 3: [milestone title] — [one sentence]
Week 4: [milestone title] — [one sentence]

Only the timeline.`;

  let fullText = '';

  await streamGroqResponse(
    systemPrompt,
    query,
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

  const lines = fullText.split('\n');
  const timelineNodeIds: string[] = [];
  const emitPromises: Promise<void>[] = [];

  for (const line of lines) {
    const match = line.match(/^Week\s*(\d+):\s*(.*)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) {
        const item = match[2].trim();
        const parts = item.split(/[—–-]/);
        const milestoneTitle = parts[0].trim();
        const nodeId = crypto.randomUUID();
        timelineNodeIds.push(nodeId);

        emitPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'synthesizer',
                type: 'node_created',
                payload: {
                  node: {
                    id: nodeId,
                    type: 'milestone',
                    label: `Week ${num}: ${milestoneTitle}`,
                    content: item,
                    agentId: 'synthesizer',
                    timestamp: Date.now(),
                  },
                },
                timestamp: Date.now(),
              });
              resolve();
            }, (num - 1) * 300);
          })
        );
      }
    }
  }
  await Promise.all(emitPromises);

  // Chain Week 1 -> Week 2 -> Week 3 -> Week 4 with depends edges
  for (let i = 0; i < timelineNodeIds.length - 1; i++) {
    onEvent({
      agentId: 'synthesizer',
      type: 'edge_created',
      payload: {
        edge: {
          id: crypto.randomUUID(),
          source: timelineNodeIds[i],
          target: timelineNodeIds[i + 1],
          type: 'depends',
        },
      },
      timestamp: Date.now(),
    });
    await new Promise((r) => setTimeout(r, 100));
  }

  return fullText;
}
