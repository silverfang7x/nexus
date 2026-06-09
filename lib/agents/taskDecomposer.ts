import { callAgent } from "@/lib/gemini";
import crypto from "crypto";

export interface DailyTask {
  day: number;           // 1-5
  title: string;         // short action title, max 6 words
  description: string;   // one sentence of what to actually do
  duration: string;      // e.g. "2-3 hours", "half day", "full day"
  deliverable: string;   // what done looks like — one sentence
}

export async function decomposeMilestone(
  milestoneLabel: string,
  milestoneContent: string,
  projectContext: string,  // summary of the overall project plan
  onTask: (task: DailyTask, nodeId: string) => void
): Promise<DailyTask[]> {
  const systemPrompt = `You are a senior project manager breaking down a weekly milestone into 5 specific daily tasks for a developer.

You will receive:
- The milestone: what needs to be accomplished this week
- Project context: what the overall project is

Generate EXACTLY 5 daily tasks (Day 1 through Day 5).
Each task must be:
- Specific enough that a developer knows exactly what to do
- Achievable in one day by a solo developer
- Building on the previous day's work

Respond ONLY with valid JSON array. No markdown, no backticks.

Schema:
[
  {
    'day': 1,
    'title': 'Short action title',
    'description': 'One sentence of exactly what to build or do',
    'duration': 'Estimated hours',
    'deliverable': 'What done looks like'
  },
  ...5 items total
]`;

  const userPrompt = `Milestone: ${milestoneLabel}
Details: ${milestoneContent}
Project context: ${projectContext}`;

  let responseText = "";
  try {
    responseText = await callAgent(systemPrompt, userPrompt);
  } catch (error) {
    console.error("Gemini task decomposer API call failed:", error);
  }

  let tasks: DailyTask[] = [];

  try {
    // Strip markdown fences before JSON.parse
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length === 5) {
      tasks = parsed as DailyTask[];
    } else {
      throw new Error("Invalid task array length");
    }
  } catch (error) {
    console.error("Failed to parse milestone decomposition, using fallback:", error);
    tasks = [
      {
        day: 1,
        title: "Setup",
        description: "Initialize development environment and structure for this milestone.",
        duration: "4 hours",
        deliverable: "Ready dev workspace."
      },
      {
        day: 2,
        title: "Core feature",
        description: "Implement the primary logic and database access for this week's requirement.",
        duration: "6 hours",
        deliverable: "Working core functions."
      },
      {
        day: 3,
        title: "Integration",
        description: "Integrate database operations, services, and backend endpoints.",
        duration: "6 hours",
        deliverable: "Connected interfaces."
      },
      {
        day: 4,
        title: "Testing",
        description: "Write unit and manual verification tests to identify edge cases.",
        duration: "4 hours",
        deliverable: "Fully passing test suite."
      },
      {
        day: 5,
        title: "Polish + deploy",
        description: "Resolve final code review suggestions, polish code styles, and prepare for release.",
        duration: "4 hours",
        deliverable: "PR submitted and verified build."
      }
    ];
  }

  for (const task of tasks) {
    const nodeId = crypto.randomUUID();
    onTask(task, nodeId);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return tasks;
}
