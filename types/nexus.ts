export type NexusMode = 'debate' | 'research' | 'code' | 'plan';

export type AgentId = 'advocate' | 'challenger' | 'factchecker' | 'codeanalyst' | 'synthesizer' | 'orchestrator';

export type AgentStatus = 'idle' | 'thinking' | 'responding' | 'done' | 'error';

export type NodeType = 
  | 'claim'        // debate: an argument being made
  | 'rebuttal'     // debate: a challenge to a claim
  | 'fact'         // research: a verified fact
  | 'source'       // research: a source document
  | 'file'         // code: a source code file
  | 'issue'        // code: a bug or problem found
  | 'fix'          // code: a proposed solution
  | 'feature'      // plan: a planned feature
  | 'risk'         // plan: a project risk
  | 'milestone';   // plan: a timeline milestone

export type EdgeType = 'supports' | 'rebuts' | 'verifies' | 'contradicts' | 'depends' | 'fixes' | 'links';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  agentId: AgentId;
  confidence?: number;  // 0-1, used by fact-checker
  timestamp: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}

export interface AgentEvent {
  agentId: AgentId;
  type: 'thinking' | 'node_created' | 'edge_created' | 'message' | 'done' | 'error';
  payload: {
    node?: GraphNode;
    edge?: GraphEdge;
    text?: string;
    error?: string;
  };
  timestamp: number;
}

export interface NexusSession {
  id: string;
  mode: NexusMode;
  query: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  events: AgentEvent[];
  status: 'idle' | 'running' | 'complete' | 'error';
  verdict?: string;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  color: string;  // hex color for the agent panel
  systemPrompt: string;
}
