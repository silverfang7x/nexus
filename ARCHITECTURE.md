# NEXUS Architecture

NEXUS is a full-stack agentic reasoning platform built on Next.js. Agents run server-side, emit structured events over Server-Sent Events (SSE), and the client renders those events as a live force-directed graph.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser (Client)                              │
│                                                                         │
│  ┌──────────────┐    POST /api/stream     ┌─────────────────────────┐  │
│  │ ModeSelector │ ──────────────────────► │   useAgentStream hook   │  │
│  │ Query input  │                         │   (ReadableStream SSE)  │  │
│  └──────────────┘                         └───────────┬─────────────┘  │
│                                                       │                 │
│         ┌─────────────────────────────────────────────┼───────────┐   │
│         │                                             ▼           │   │
│         │  AgentEvent[] ──► nodes[], edges[] ──► useGraph (D3)   │   │
│         │       │                              NexusGraph canvas  │   │
│         │       └──► AgentPanel thought streams                   │   │
│         └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          text/event-stream
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Next.js Server (App Router)                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    POST /api/stream                              │   │
│  │  ReadableStream controller ──► send(AgentEvent)                 │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Orchestrator                                │   │
│  │  detectMode(query) ──► debate | research | code | plan          │   │
│  │  runDebateMode() ──► 4-round agent chain                        │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │ onEvent callback                     │
│          ┌───────────────────────┼───────────────────────┐             │
│          ▼                       ▼                       ▼             │
│    ┌──────────┐          ┌────────────┐          ┌─────────────┐       │
│    │ Advocate │          │ Challenger │          │ Synthesizer │       │
│    └────┬─────┘          └─────┬──────┘          └──────┬──────┘       │
│         │                      │                        │              │
│         └──────────────────────┴────────────────────────┘              │
│                                │                                        │
│                                ▼                                        │
│                    Gemini 2.5 Flash (callAgent / streamAgent)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent message bus

NEXUS does not use a separate message-queue service. The **message bus is the `AgentEvent` stream** — a typed, append-only sequence of events that flows from agents through the orchestrator to the SSE endpoint and into React state.

### Event schema

Every agent communicates through the same envelope defined in `types/nexus.ts`:

```typescript
interface AgentEvent {
  agentId: AgentId;          // who emitted it
  type: 'thinking' | 'node_created' | 'edge_created' | 'message' | 'done' | 'error';
  payload: {
    node?: GraphNode;        // new graph vertex
    edge?: GraphEdge;        // new graph connection
    text?: string;           // thought stream or verdict
    error?: string;
  };
  timestamp: number;
}
```

### Bus pattern

Each agent runner (`runAdvocate`, `runChallenger`, `runSynthesizer`, …) accepts an optional `onEvent` callback. The orchestrator passes a single `send` function down the chain:

```
orchestrator.send(event)
       ▲
       │ onEvent(event)
       │
  advocate ──► challenger ──► advocate (refine) ──► synthesizer
```

Agents never talk to each other directly. The orchestrator controls turn order and passes **text context** (previous agent output) as the next agent's input. Graph structure is built incrementally as agents emit `node_created` and `edge_created` events — for example, the Challenger creates a rebuttal node and a `rebuts` edge pointing at the matching claim.

### Event types in practice

| Type | Purpose |
|---|---|
| `thinking` | Agent started work; client marks agent as active |
| `node_created` | New claim, rebuttal, fact, file, milestone, etc. on the canvas |
| `edge_created` | Relationship between two nodes (`supports`, `rebuts`, `verifies`, …) |
| `message` | Free-form text (e.g. synthesizer verdict paragraph) |
| `done` | Session complete; stream closes |
| `error` | Failure; client sets status to `error` |

This design keeps agents decoupled, makes the graph a pure projection of events, and allows mock replays from JSON files without changing the client.

---

## SSE pipeline

### Server side (`app/api/stream/route.ts`)

1. Client sends `POST /api/stream` with `{ mode, query, useMock? }`.
2. Server creates a `ReadableStream` and a local `send(event)` helper that encodes each event as `data: {json}\n\n`.
3. Depending on mode and mock flag:
   - **Mock:** replays events from `mock/{mode}-sample.json` with 300ms delay between events.
   - **Live debate:** calls `runDebateMode(query, send)`.
   - **Other modes (live):** returns a placeholder `done` event (agents stubbed).
4. Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

### Client side (`hooks/useAgentStream.ts`)

1. `startSession(mode, query, useMock)` opens a fetch to `/api/stream`.
2. Reads the response body with `ReadableStream.getReader()`.
3. Buffers chunks, splits on `\n\n`, parses `data:` lines as JSON.
4. Dispatches each `AgentEvent` into React state:
   - `node_created` → append to `nodes[]`
   - `edge_created` → append to `edges[]`
   - `thinking` → add to `activeAgents[]`
   - `done` → set `status: 'complete'`, capture verdict text
   - `error` → set `status: 'error'`

The graph hook (`useGraph`) watches `nodes` and `edges` and runs a D3 `forceSimulation` with charge, link, and center forces — nodes animate into position on every tick.

---

## Mode system

### Modes

| Mode | Agents | Node types | Status |
|---|---|---|---|
| `debate` | Advocate → Challenger → Advocate → Synthesizer | `claim`, `rebuttal` | **Live** |
| `research` | Fact-checker + synthesizer (planned) | `fact`, `source` | Mock + stub |
| `code` | Code analyst (planned) | `file`, `issue`, `fix` | Mock + stub |
| `plan` | Planner agents (planned) | `feature`, `risk`, `milestone` | Mock + stub |

### Mode selection

Two paths:

1. **Explicit** — user picks DEBATE / RESEARCH / CODE / PLAN in the `ModeSelector`; value passed as `mode` to `/api/stream`.
2. **Auto-detect** — `detectMode(query)` in `lib/agents/orchestrator.ts` inspects keywords:
   - GitHub URL / "repo" / "codebase" → `code`
   - "build" / "app" / "startup" / "idea" → `plan`
   - "research" / "what is" / "explain" → `research`
   - default → `debate`

### Debate round sequence

```
Round 1  Advocate      → 4 numbered claims        → claim nodes
Round 2  Challenger    → 4 numbered rebuttals     → rebuttal nodes + rebuts edges
Round 3  Advocate      → refined claims           → refined-claim nodes
Round 4  Synthesizer   → 3-paragraph verdict      → message event
```

Each round emits `thinking` events so the UI can show live agent status before nodes appear.

---

## Graph model

Nodes carry a `type` (claim, rebuttal, fact, file, …), `content`, `agentId`, and optional `confidence` (0–1 for research). Edges carry a `type` (`supports`, `rebuts`, `verifies`, `contradicts`, `depends`, `fixes`, `links`).

The canvas is mode-agnostic: it renders whatever nodes and edges the active agent chain produces. Mode-specific UI (debate split panels, code diff, plan timeline) lives in `components/modes/` and wraps the shared graph.

---

## Gemini integration

`lib/gemini.ts` wraps the Google Generative AI SDK:

- **`callAgent(systemPrompt, userMessage)`** — single-shot completion used by all live agents today.
- **`streamAgent(systemPrompt, userMessage, onChunk)`** — token streaming (available for future live thought streams).
- Model: `gemini-2.5-flash-latest`.
- Built-in 429 retry with 4-second backoff.

Each agent has a focused system prompt (see `AGENT_CONFIGS`) that constrains output format — numbered lists for claims/rebuttals, structured paragraphs for synthesis.

---

## Extension points

To add a new mode:

1. Create agent runners in `lib/agents/` that accept `onEvent` and emit `node_created` / `edge_created`.
2. Add `run{Mode}Mode()` to the orchestrator.
3. Wire the mode branch in `app/api/stream/route.ts`.
4. Add a mock file at `mock/{mode}-sample.json` for offline development.
5. Build the mode layout in `components/modes/{Mode}Mode.tsx`.

The message bus, SSE transport, and graph renderer require no changes — only new event producers and UI chrome.
