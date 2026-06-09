import { AgentEvent } from "@/types/nexus";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

export async function runResearchMode(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  // ──────────────────────────────────────────────────────────────────────────
  // AGENT 1: Scout (agentId: 'factchecker')
  // ──────────────────────────────────────────────────────────────────────────
  onEvent({
    agentId: 'factchecker',
    type: 'thinking',
    payload: { text: 'Scouting top 5 key research sub-questions...' },
    timestamp: Date.now(),
  });

  const scoutSystemPrompt = `You are a research agent. Given a topic, identify the 5 most important sub-questions that must be answered to fully understand it.

Format:
1. [Question]
2. [Question]
3. [Question]
4. [Question]
5. [Question]

Only the numbered list.`;

  let scoutOutput = '';
  await streamGroqResponse(
    scoutSystemPrompt,
    query,
    (token) => {
      scoutOutput += token;
      onEvent({
        agentId: 'factchecker',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now(),
      });
    },
    (_full) => {
      onEvent({
        agentId: 'factchecker',
        type: 'complete',
        payload: { text: _full },
        timestamp: Date.now(),
      });
    }
  );

  const lines = scoutOutput.split('\n');
  const questionNodeIds: string[] = [];
  const questionTexts: string[] = [];
  const scoutNodeEmits: Promise<void>[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 5) {
        const questionText = match[2].trim();
        const nodeId = crypto.randomUUID();
        questionNodeIds[num - 1] = nodeId;
        questionTexts[num - 1] = questionText;

        let shortLabel = questionText;
        if (shortLabel.endsWith('?')) shortLabel = shortLabel.slice(0, -1);
        if (shortLabel.length > 25) shortLabel = shortLabel.substring(0, 22).trim() + '...';

        scoutNodeEmits.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'factchecker',
                type: 'node_created',
                payload: {
                  node: {
                    id: nodeId,
                    type: 'source',
                    label: questionText.slice(0, 28).replace(/\*\*/g, '').trim(),
                    content: questionText,
                    agentId: 'factchecker',
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
  await Promise.all(scoutNodeEmits);

  // ──────────────────────────────────────────────────────────────────────────
  // AGENT 2: Analyst (agentId: 'advocate')
  // ──────────────────────────────────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 400));
  onEvent({
    agentId: 'advocate',
    type: 'thinking',
    payload: { text: 'Analyzing sub-questions and forming findings...' },
    timestamp: Date.now(),
  });

  const analystSystemPrompt = `You are an expert analyst. For each research question below, provide a 1-sentence finding with a confidence level.

Format for each:
Q[n]: [Finding] [Confidence: High/Medium/Low]

Be specific. Cite general knowledge, not invented sources.`;

  const analystInput =
    `Topic: ${query}\n\nQuestions to analyze:\n` +
    questionTexts.map((q, idx) => `${idx + 1}. ${q}`).join('\n');

  let analystOutput = '';
  await streamGroqResponse(
    analystSystemPrompt,
    analystInput,
    (token) => {
      analystOutput += token;
      onEvent({
        agentId: 'advocate',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now(),
      });
    },
    (_full) => {
      onEvent({
        agentId: 'advocate',
        type: 'complete',
        payload: { text: _full },
        timestamp: Date.now(),
      });
    }
  );

  const analystLines = analystOutput.split('\n');
  const analystNodeEmits: Promise<void>[] = [];

  for (const line of analystLines) {
    const match = line.match(/^\s*Q(\d+):\s*(.*?)\s*\[Confidence:\s*(High|Medium|Low)\]/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 5) {
        const finding = match[2].trim();
        const confidenceLabel = match[3].toLowerCase();
        let confidenceValue = 0.65;
        if (confidenceLabel === 'high') confidenceValue = 0.9;
        else if (confidenceLabel === 'low') confidenceValue = 0.4;

        const sourceNodeId = questionNodeIds[num - 1];
        if (!sourceNodeId) continue;

        const factNodeId = crypto.randomUUID();
        let shortLabel = finding;
        if (shortLabel.length > 25) shortLabel = shortLabel.substring(0, 22).trim() + '...';

        analystNodeEmits.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              onEvent({
                agentId: 'advocate',
                type: 'node_created',
                payload: {
                  node: {
                    id: factNodeId,
                    type: 'fact',
                    label: finding.slice(0, 28).replace(/\*\*/g, '').trim(),
                    content: finding,
                    agentId: 'advocate',
                    confidence: confidenceValue,
                    timestamp: Date.now(),
                  },
                },
                timestamp: Date.now(),
              });

              onEvent({
                agentId: 'advocate',
                type: 'edge_created',
                payload: {
                  edge: {
                    id: crypto.randomUUID(),
                    source: factNodeId,
                    target: sourceNodeId,
                    type: 'verifies',
                  },
                },
                timestamp: Date.now(),
              });
              resolve();
            }, (num - 1) * 350);
          })
        );
      }
    }
  }
  await Promise.all(analystNodeEmits);

  // ──────────────────────────────────────────────────────────────────────────
  // AGENT 3: Synthesizer (agentId: 'synthesizer')
  // ──────────────────────────────────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 400));
  onEvent({
    agentId: 'synthesizer',
    type: 'thinking',
    payload: { text: 'Synthesizing comprehensive research blueprint...' },
    timestamp: Date.now(),
  });

  const synthesizerSystemPrompt = `You are a research synthesizer.
Respond with ONLY valid JSON — no markdown fences, no preamble, no trailing text.

Output this exact schema:
{
  "tldr": "one sentence summary of what the research reveals",
  "findings": [
    {"claim": "specific finding", "source": "general knowledge / domain area", "verified": true},
    {"claim": "specific finding", "source": "general knowledge / domain area", "verified": true},
    {"claim": "specific finding", "source": "general knowledge / domain area", "verified": false}
  ],
  "consensus": "what the majority of evidence agrees on, in one sentence",
  "contradictions": ["area where evidence conflicts 1", "area where evidence conflicts 2"],
  "verdict": "synthesized conclusion in 2-3 sentences — what is actually known and what remains uncertain"
}

Rules:
- "tldr" is one sentence under 20 words
- "findings" must have 3-5 items; set "verified" true for high-confidence findings
- "source" is a general domain or knowledge area, NOT an invented URL
- "contradictions" must have 1-3 items
- Output ONLY the JSON object, nothing else`;

  const synthesizerInput = `Topic: ${query}

Research Questions:
${scoutOutput}

Findings:
${analystOutput}`;

  let rawSynthesis = '';
  await streamGroqResponse(
    synthesizerSystemPrompt,
    synthesizerInput,
    (token) => {
      rawSynthesis += token;
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

  const synthesis = rawSynthesis
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  onEvent({
    agentId: 'synthesizer',
    type: 'message',
    payload: { text: synthesis },
    timestamp: Date.now(),
  });

  onEvent({
    agentId: 'synthesizer',
    type: 'done',
    payload: { text: synthesis },
    timestamp: Date.now(),
  });

  return synthesis;
}
