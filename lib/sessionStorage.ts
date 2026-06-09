import { NexusMode, NexusSession, AllModeStates } from '@/types/nexus';

const SESSION_KEY = 'nexus_sessions';
const MAX_SESSIONS = 3;

export function saveSession(
  modeStates: AllModeStates,
  primaryMode: NexusMode,
  sessionStartTime: number
): void {
  if (typeof window === 'undefined') return;
  const existing = getSessions();
  
  const primaryQuery = modeStates[primaryMode].query;

  // Filter out any older session with the exact same primaryQuery and primaryMode to avoid duplicates
  const filtered = existing.filter(
    s => !(s.primaryQuery === primaryQuery && s.primaryMode === primaryMode)
  );

  const modes = {
    debate: modeStates.debate.hasRun ? {
      query: modeStates.debate.query,
      nodes: modeStates.debate.nodes,
      edges: modeStates.debate.edges,
      structuredOutput: modeStates.debate.structuredOutput,
      ranAt: Date.now()
    } : null,
    research: modeStates.research.hasRun ? {
      query: modeStates.research.query,
      nodes: modeStates.research.nodes,
      edges: modeStates.research.edges,
      structuredOutput: modeStates.research.structuredOutput,
      ranAt: Date.now()
    } : null,
    code: modeStates.code.hasRun ? {
      query: modeStates.code.query,
      nodes: modeStates.code.nodes,
      edges: modeStates.code.edges,
      structuredOutput: modeStates.code.structuredOutput,
      ranAt: Date.now()
    } : null,
    plan: modeStates.plan.hasRun ? {
      query: modeStates.plan.query,
      nodes: modeStates.plan.nodes,
      edges: modeStates.plan.edges,
      structuredOutput: modeStates.plan.structuredOutput,
      ranAt: Date.now()
    } : null,
  };

  const newSession: NexusSession = {
    id: '',
    timestamp: Date.now(),
    durationMs: Date.now() - sessionStartTime,
    primaryMode,
    primaryQuery,
    modes
  };

  const updated = [newSession, ...filtered].slice(0, MAX_SESSIONS);
  
  // Renumber IDs: most recent = 001, second = 002, third = 003
  const renumbered = updated.map((s, i) => ({
    ...s,
    id: String(i + 1).padStart(3, '0')
  }));
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(renumbered));
}

export function getSessions(): NexusSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSessions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
