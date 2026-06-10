# NEXUS — Autonomous Multi-Agent Intelligence Platform

[![Vercel Deployment](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen?style=for-the-badge&logo=vercel)](https://nexus-gules-seven.vercel.app)
[![YouTube Video](https://img.shields.io/badge/Watch-Demo%20Video-red?style=for-the-badge&logo=youtube)](https://youtu.be/Ksdkn-romsg)
[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev)
[![D3.js Version](https://img.shields.io/badge/D3.js-7.9.0-orange?style=for-the-badge&logo=d3.js)](https://d3js.org)

NEXUS is an advanced agentic reasoning platform that breaks the boundaries of linear chat interfaces. Instead of a single chatbot answering in isolation, NEXUS orchestrates a collaborative swarm of specialized AI agents that argue, research, analyze, and synthesize knowledge in real-time. Every thought, claim, and dependency is rendered as a live, interactive force-directed graph on an infinite canvas.

**🔗 Experience the Live Application:** [https://nexus-gules-seven.vercel.app](https://nexus-gules-seven.vercel.app)

**📺 Watch the Video Demonstration:** [https://youtu.be/Ksdkn-romsg](https://youtu.be/Ksdkn-romsg)

---

## 🌌 The Vision: Breaking the Chatbot Box
Most AI interfaces treat reasoning as a linear stream of text. NEXUS believes that complex thinking is web-like, structured, and multidirectional. By projecting multi-agent collaborations as a live network graph of nodes (representing claims, files, milestones, etc.) and edges (representing supports, rebuttals, dependencies, etc.), users can watch AI reasoning unfold step-by-step, audit the debate, and interactively shape the outputs.

---

## 🚀 The Four Core Intelligence Modes

NEXUS features four specialized operating modes, each using a tailored sequence of AI agents and distinct visual layouts:

### ⚖️ 1. Debate Mode
* **The Swarm:** `Advocate Agent` ➔ `Challenger Agent` ➔ `Advocate Agent (Refinement)` ➔ `Synthesizer Agent`.
* **The Mechanics:** The Advocate builds the strongest case for a position, the Challenger reviews the claims to spawn counter-arguments, and the Synthesizer balances the debate to draw a final verdict with a calibrated confidence index.
* **The Visualization:** Claims and rebuttals cluster dynamically, connected by supporting (lavender) and rebuttal (coral-red) edges.

### 🔍 2. Research Mode
* **The Swarm:** `Fact-Checker Agent` ➔ `Synthesizer Agent`.
* **The Mechanics:** Queries live sources, extracts key facts, checks source credibility, and synthesizes consensus.
* **The Visualization:** Credibility ratings are represented as colorful confidence rings around source and fact nodes.

### 💻 3. Code Mode
* **The Swarm:** `Code Analyst Agent` ➔ `Synthesizer Agent`.
* **The Mechanics:** Input any public GitHub repository URL. The engine crawls the structure, reads key source files, analyzes import declarations to establish file dependencies, runs deep static review for bugs, security risks, and optimization points, and outputs an architectural health score out of 10.
* **The Visualization:** A structured, hierarchical tree-like column layout (Files column ➔ Issues column ➔ Fixes column) displaying the files, found issues (red nodes), and proposed fixes.

### 📋 4. Plan Mode
* **The Swarm:** `Planner Agent` ➔ `Architect Agent` ➔ `Risk Agent` ➔ `Timeline Agent` ➔ `Blueprint Synthesizer`.
* **The Mechanics:** Converts any product spec or startup idea into a comprehensive technical blueprint containing stack requirements, timeline milestones, product features, and key project risks.
* **The Visualization:** A chronological roadmapped grid layout plotting week-by-week progress nodes.

---

## ⚡ Special Mechanics (Premium Features)

NEXUS is equipped with advanced features that make human-agent collaboration highly interactive:

* **Interactive Task Decomposer:** Click any milestone or feature node in the graph to expand it. A specialized task decomposer agent breaks it down live into granular daily tasks, generating new nodes and edges on the fly.
* **Contextual Continuation Engine:** Extend a completed session by entering follow-up instructions. NEXUS analyzes the existing context and appends new nodes, linking them to existing ones via semantic tag connections.
* **Session Storage & Restoration:** A sidebar drawer that automatically saves the graph, mode, nodes, edges, query, and an AI-extracted TLDR summary of previous runs using `localStorage` for instant reactivation.
* **Structured Markdown Export:** Generate and copy/download a full Github-Flavored Markdown specification of your entire session (including nodes, relationships, and synthesizer output) with a single click.
* **Developer Mock Mode:** Toggle mock execution to replay pre-recorded streams from `mock/` without API costs. Perfect for demonstrations and local UI development.

---

## 🛠️ Under the Hood: Technical Architecture

```
                               ┌─────────────────────────┐
                               │     Next.js Client      │
                               │   (React 19 + D3.js)    │
                               └────────────┬────────────┘
                                            │ POST /api/stream
                                            ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │                               Next.js Server Route                                  │
 │                                                                                     │
 │ ┌───────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────┐ │
 │ │   Query Preprocessor  │ ➔ │        Orchestrator       │ ➔ │    Agent Pipeline   │ │
 │ │   (Intent Detection)  │   │  (Mode Routing & Swarms)  │   │  (Gemini / Groq API)│ │
 │ └───────────────────────┘   └───────────────────────────┘   └─────────────────────┘ │
 └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                            │ Server-Sent Events (SSE)
                                            ▼
                               ┌─────────────────────────┐
                               │    useAgentStream Hook  │
                               │   (Client State Buffer) │
                               └────────────┬────────────┘
                                            ▼
                               ┌─────────────────────────┐
                               │   Interactive Canvas    │
                               │   (D3 Force Simulation) │
                               └─────────────────────────┘
```

1. **Query Preprocessor:** Every query passes through an intent preprocessor powered by Gemini that corrects spelling, determines knowledge domains, extracts core entities, and verifies if the prompt is a session continuation or a new run.
2. **Server-Sent Events (SSE) Pipeline:** Real-time tokens and events are streamed down an append-only network pipe using `ReadableStream` and Server-Sent Events (`text/event-stream`), keeping server logic and client rendering decoupled.
3. **D3.js Force Simulation Engine:** The client-side D3 engine translates graph state changes into smooth layouts using charging, collision, and connection forces, ensuring high-performance canvas physics.
4. **Dual-LLM Engine:** Orchestrated with Gemini 2.5 Flash (`gemini-2.5-flash-latest`) for multi-step reasoning and orchestrations, alongside Groq (`llama-3.3-70b-versatile`) for ultra-low latency token streams.

---

## 🎨 Design System & Aesthetics
NEXUS uses a highly custom design system specified in [DESIGN.md](./DESIGN.md):
* **Radical Glassmorphism:** Clean `0px` sharp corners combined with subtle transparent backdrops (`rgba(255,255,255,0.04)`), high-end backdrop-filters, and 8% opacity grain noise texture overlays.
* **Curated Dark Color System:** Deep canvas colors (`#0A0A0F`), harmonized HSL palettes, and distinctive neon badge indicators for each agent (Teal, Blue, Purple, Coral).
* **Responsive Layout:** Tailored layouts for both wide desktop monitors and touch-responsive mobile devices.

---

## ⚙️ Quick Installation (Under 2 Minutes)

Get a local instance of NEXUS running on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/silverfang7x/nexus.git
cd nexus
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add API Keys
Create a `.env.local` file in the root directory and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```
> * Note: You can acquire a free Gemini key at [Google AI Studio](https://aistudio.google.com) and a free Groq key at [Groq Console](https://console.groq.com).*

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure

```
├── app/
│   ├── api/
│   │   ├── stream/             # SSE streaming route — orchestrates agent swarms
│   │   └── decompose/          # Decomposes milestone nodes into task sub-nodes
│   └── (dashboard)/            # Dashboard layout and canvas page shell
├── components/
│   ├── canvas/                 # D3.js force-directed canvas & node renderers
│   ├── output/                 # Swarm thought streams & VerdictPanel output components
│   └── ui/                     # Design system UI components (Buttons, Drawers, Inputs)
├── hooks/
│   ├── useAgentStream.ts       # Consumes Server-Sent Events from stream endpoint
│   └── useGraph.ts             # Orchestrates D3 simulation forces and drag interactions
├── lib/
│   ├── agents/                 # Code for all specialized agents and orchestrators
│   ├── gemini.ts               # Google Generative AI SDK connection wrapper
│   └── groq.ts                 # Groq SDK connection wrapper
├── types/
│   └── nexus.ts                # TypeScript declarations (AgentEvents, GraphNodes, etc.)
├── DESIGN.md                   # Single source of truth for UI token style guide
└── ARCHITECTURE.md             # Developer handbook outlining the messaging bus
```

---

## 🛡️ License
Private — all rights reserved. Developed as a cutting-edge playground for multi-agent reasoning.
