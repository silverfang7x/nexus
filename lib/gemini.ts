import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentId, AgentConfig } from "@/types/nexus";

/** Minimal shape of errors thrown by the Gemini SDK (not exported by the package). */
interface GeminiError {
  message?: string;
  status?: number;
  statusText?: string;
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_MODEL = "gemini-2.5-flash-latest";

export async function callAgent(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: { role: string; content: string }[]
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: systemPrompt,
  });

  const history = conversationHistory?.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  })) || [];

  const chat = model.startChat({
    history,
  });

  try {
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: unknown) {
    const err = error as GeminiError;
    if (
      err?.status === 429 ||
      err?.message?.includes("429") ||
      err?.statusText === "Too Many Requests" ||
      err?.message?.includes("Too Many Requests")
    ) {
      console.warn("Rate limited (429). Retrying in 4 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 4000));
      try {
        const retryResult = await chat.sendMessage(userMessage);
        return retryResult.response.text();
      } catch (retryError: unknown) {
        const retryErr = retryError as GeminiError;
        throw new Error(`Gemini API error after retry: ${retryErr.message || retryError}`);
      }
    }
    throw new Error(`Gemini API error: ${err.message || error}`);
  }
}

export async function streamAgent(
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: systemPrompt,
  });

  try {
    const chat = model.startChat();
    const result = await chat.sendMessageStream(userMessage);

    let fullText = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }
    
    return fullText;
  } catch (error: unknown) {
    const err = error as GeminiError;
    throw new Error(`Gemini API streaming error: ${err.message || error}`);
  }
}

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  advocate: {
    id: "advocate",
    name: "Advocate",
    role: "Builds the strongest possible case for the position",
    color: "#E8593C",
    systemPrompt: "You are the Advocate agent. Your role is to build the strongest possible case for the given position.",
  },
  challenger: {
    id: "challenger",
    name: "Challenger",
    role: "Finds every flaw and counter-argument",
    color: "#E24B4A",
    systemPrompt: "You are the Challenger agent. Your role is to find every flaw and counter-argument to the provided claims.",
  },
  factchecker: {
    id: "factchecker",
    name: "Fact-Checker",
    role: "Verifies claims against live sources",
    color: "#1D9E75",
    systemPrompt: "You are the Fact-Checker agent. Your role is to verify claims against factual sources and determine their confidence levels.",
  },
  codeanalyst: {
    id: "codeanalyst",
    name: "Code Analyst",
    role: "Analyses architecture and identifies improvements",
    color: "#378ADD",
    systemPrompt: "You are the Code Analyst agent. Your role is to analyze codebase architecture, identify issues, and propose fixes.",
  },
  synthesizer: {
    id: "synthesizer",
    name: "Synthesizer",
    role: "Synthesizes all inputs into a final verdict",
    color: "#7F77DD",
    systemPrompt: "You are the Synthesizer agent. Your role is to evaluate claims, rebuttals, and facts, and synthesize them into a final verdict.",
  },
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Routes queries and coordinates agents",
    color: "#888780",
    systemPrompt: "You are the Orchestrator agent. Your role is to coordinate other agents and determine the flow of the session.",
  },
};
