import { NexusMode, GraphNode, GraphEdge } from '@/types/nexus';

export interface NexusSession {
  id: string;           // "001", "002", "003"
  mode: NexusMode;
  query: string;
  cleanQuery: string;   // from preprocessor
  nodes: GraphNode[];
  edges: GraphEdge[];
  structuredOutput: unknown;
  timestamp: number;
  durationMs: number;   // how long the run took
}

const SESSION_KEY = 'nexus_sessions';
const MAX_SESSIONS = 3;

export function saveSession(session: NexusSession): void {
  if (typeof window === 'undefined') return;
  const existing = getSessions();
  
  // Filter out any older session with the exact same query and mode to avoid duplicates
  const filtered = existing.filter(
    s => !(s.query === session.query && s.mode === session.mode)
  );

  const updated = [session, ...filtered].slice(0, MAX_SESSIONS);
  
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
