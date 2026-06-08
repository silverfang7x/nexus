import { NexusMode } from "@/types/nexus";
import { callAgent } from "@/lib/gemini";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcessedQuery {
  /** The cleaned, spell-corrected, complete query */
  cleanQuery: string;

  /** The detected mode — may override what the user selected */
  detectedMode: NexusMode;

  /** Confidence in mode detection 0-1 */
  modeConfidence: number;

  /** One sentence describing what the user actually wants */
  intent: string;

  /** The domain/field this query belongs to */
  domain: string;

  /** Key entities extracted (names, technologies, concepts) */
  entities: string[];

  /** Whether the original query was ambiguous */
  wasAmbiguous: boolean;

  /** The original raw query before processing */
  originalQuery: string;

  /**
   * Enriched version — the actual string passed to agents.
   * Combines cleanQuery with intent and key entities for richer context.
   */
  enrichedQuery: string;
}

// ─── Mode keywords (fast path before LLM) ────────────────────────────────────

const MODE_KEYWORDS: Record<NexusMode, string[]> = {
  code: ["github.com", "repo", "codebase", "refactor", "pull request", "pr", "branch", "commit"],
  plan: [
    "build", "app", "startup", "project", "idea", "launch", "mvp",
    "product", "saas", "feature", "roadmap", "spec", "banani", "bana",
  ],
  research: [
    "research", "what is", "explain", "analyse", "analyze", "how does",
    "history of", "overview of", "compare", "vs", "difference between",
  ],
  debate: [
    "should", "argue", "debate", "pros and cons", "is it right", "better or worse",
  ],
};

/** Fast keyword-based mode detection (no LLM). Returns null if uncertain. */
function fastDetectMode(query: string): { mode: NexusMode; confidence: number } | null {
  const lower = query.toLowerCase();
  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { mode: mode as NexusMode, confidence: 0.7 };
      }
    }
  }
  return null;
}

// ─── Fallback for graceful degradation ───────────────────────────────────────

function buildFallback(rawQuery: string, userSelectedMode: NexusMode): ProcessedQuery {
  const clean = rawQuery.trim() || "Tell me something interesting about AI.";
  return {
    cleanQuery: clean,
    detectedMode: userSelectedMode,
    modeConfidence: 0.5,
    intent: "User wants to explore: " + clean,
    domain: "General",
    entities: [],
    wasAmbiguous: true,
    originalQuery: rawQuery,
    enrichedQuery: clean,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Pre-processes a raw user query before any agent fires.
 *
 * Responsibilities:
 *  - Spell-correct and clean up the query
 *  - Detect the most appropriate NexusMode (may differ from userSelectedMode)
 *  - Extract intent, domain, and key entities
 *  - Build an enriched query string for downstream agents
 *
 * Falls back gracefully if the LLM call fails.
 */
export async function preprocessQuery(
  rawQuery: string,
  userSelectedMode: NexusMode
): Promise<ProcessedQuery> {
  // Guard: empty or single-word query
  const trimmed = rawQuery.trim();
  if (!trimmed || trimmed.split(/\s+/).length <= 1) {
    return buildFallback(trimmed, userSelectedMode);
  }

  // Fast path: if keywords clearly indicate a mode, skip LLM for mode detection
  const fastMode = fastDetectMode(trimmed);

  const systemPrompt = `You are a query pre-processor for an AI reasoning engine called NEXUS.
Your job is to analyze a user's raw query and return structured JSON.

NEXUS has 4 modes:
- "debate": For contested questions, philosophical arguments, should/shouldn't questions
- "research": For factual inquiries, explanations, comparisons, "what is", "how does"
- "plan": For building apps, startups, products, features, or project planning
- "code": For analyzing code repositories, GitHub links, debugging, architecture review

You MUST return ONLY a JSON object with exactly these fields (no markdown, no explanation):
{
  "cleanQuery": "<spell-corrected, grammatically complete query in English>",
  "detectedMode": "<one of: debate | research | plan | code>",
  "modeConfidence": <0.0 to 1.0>,
  "intent": "<one sentence: what the user actually wants>",
  "domain": "<the knowledge domain, e.g. Technology, Healthcare, Economics, Education>",
  "entities": ["<key entity 1>", "<key entity 2>", ...],
  "wasAmbiguous": <true | false>
}

Rules:
- If the query is in a non-English language, translate the intent to English but preserve cultural context
- If the query has typos, fix them in cleanQuery
- entities should be 2-5 specific nouns (technologies, companies, concepts, people)
- wasAmbiguous = true if the mode is unclear or the query could fit multiple modes
- modeConfidence: 0.9+ if very clear, 0.5-0.7 if somewhat clear, <0.5 if ambiguous`;

  try {
    const raw = await callAgent(systemPrompt, `Raw query: "${trimmed}"\nUser selected mode: "${userSelectedMode}"`);

    // Strip markdown fences if present
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as {
      cleanQuery?: string;
      detectedMode?: string;
      modeConfidence?: number;
      intent?: string;
      domain?: string;
      entities?: string[];
      wasAmbiguous?: boolean;
    };

    const validModes: NexusMode[] = ["debate", "research", "plan", "code"];
    const detectedMode: NexusMode =
      validModes.includes(parsed.detectedMode as NexusMode)
        ? (parsed.detectedMode as NexusMode)
        : fastMode?.mode ?? userSelectedMode;

    const cleanQuery = (parsed.cleanQuery ?? trimmed).trim();
    const intent = parsed.intent ?? `Explore: ${cleanQuery}`;
    const entities = Array.isArray(parsed.entities) ? parsed.entities.slice(0, 5) : [];
    const domain = parsed.domain ?? "General";
    const modeConfidence = typeof parsed.modeConfidence === "number"
      ? Math.min(1, Math.max(0, parsed.modeConfidence))
      : fastMode?.confidence ?? 0.5;
    const wasAmbiguous = parsed.wasAmbiguous ?? modeConfidence < 0.6;

    // Build enriched query: clean query + intent context + key entities
    const entityStr = entities.length > 0 ? ` Key concepts: ${entities.join(", ")}.` : "";
    const enrichedQuery = `${cleanQuery}\n\n[Context: ${intent}${entityStr}]`;

    return {
      cleanQuery,
      detectedMode,
      modeConfidence,
      intent,
      domain,
      entities,
      wasAmbiguous,
      originalQuery: rawQuery,
      enrichedQuery,
    };
  } catch (err) {
    console.error("[preprocessQuery] LLM parse failed, using fallback:", err);
    // Fast-mode fallback: use keyword detection + clean trimmed query
    const fallback = buildFallback(trimmed, userSelectedMode);
    if (fastMode) {
      fallback.detectedMode = fastMode.mode;
      fallback.modeConfidence = fastMode.confidence;
    }
    return fallback;
  }
}
