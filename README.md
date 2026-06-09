# NEXUS — Autonomous Multi-Agent Intelligence Platform

One platform. Four intelligence modes. Powered by a live force-directed argument graph.

## Demo
- **Plan Mode (with expanded tasks)**: ![Screenshot of plan mode with expanded tasks](./public/demo-plan.png)
- **Debate Mode (with FOR/AGAINST clustering)**: ![Screenshot of debate mode with FOR/AGAINST clustering](./public/demo-debate.png)
- **Exported Markdown**: ![Screenshot of exported markdown file](./public/demo-export.png)

## Key Features
- **Query Preprocessor**: Built-in spell correction and intent detection to seamlessly route user prompts.
- **4 Intelligence Modes**: Tailored environments for Debate, Research, Code, and Plan.
- **Task Decomposer**: Expand milestones into detailed daily tasks directly on the graph.
- **Continuation Mode**: Keep building and extending existing sessions with follow-up prompts.
- **Markdown Export**: Generate and download a complete, structured markdown blueprint of the session.

## What it does

NEXUS is an agentic reasoning system where specialized AI agents collaborate, argue, and synthesize knowledge in real-time. Every thought, claim, and connection is visualized as a living graph on an infinite canvas.

**Four modes:**

- **DEBATE** — Advocate vs Challenger agents argue any topic. Watch claims and rebuttals spawn as graph nodes.
- **RESEARCH** — Multi-agent synthesis with live web sources. Source credibility shown as node confidence rings.
- **CODE** — Paste any GitHub repo URL. Agents map, analyse, and propose improvements to the codebase.
- **PLAN** — Describe any app idea. Agents decompose it into a full technical blueprint and timeline.

## Tech Stack

- Next.js (App Router) + TypeScript
- Gemini 2.5 Flash API (free tier)
- D3.js force simulation
- Server-Sent Events for real-time streaming
- Tailwind CSS + Framer Motion
- Google Stitch MCP for UI design system

## Setup (under 2 minutes)

1. `git clone https://github.com/silverfang7x/nexus.git`
2. `npm install`
3. Add `GEMINI_API_KEY` to `.env.local` (free at [aistudio.google.com](https://aistudio.google.com))
4. `npm run dev`

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key for Gemini 2.5 Flash |

### Mock mode

Pass `useMock: true` when starting a session to replay pre-recorded events from `mock/` without calling the API. Useful for UI development and demos.

## Project structure

```
app/
  api/stream/          SSE endpoint — orchestrates agents, streams AgentEvents
  (dashboard)/         Main canvas shell
components/
  agents/              Agent panels and badges
  canvas/              D3 graph (NexusGraph, GraphNode, GraphEdge)
  modes/               Mode-specific layouts (Debate, Research, Code, Plan)
hooks/
  useAgentStream.ts    Client SSE consumer
  useGraph.ts          D3 force simulation
lib/
  agents/              Agent runners + orchestrator
  gemini.ts            Gemini API wrapper
types/
  nexus.ts             Shared types (AgentEvent, GraphNode, NexusMode)
DESIGN.md              UI design system (single source of truth)
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the agent message bus, SSE pipeline, and mode system.

## Design system

All UI must conform to [DESIGN.md](./DESIGN.md), extracted from the Stitch reference screens in `components/ui/stitch/`.

## License

Private — all rights reserved.
