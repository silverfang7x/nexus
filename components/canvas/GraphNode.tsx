import { GraphNode, AgentId } from '@/types/nexus';

export interface GraphNodeProps {
  node: GraphNode;
  activeAgents: AgentId[];
  onNodeClick?: (node: GraphNode) => void;
}

/**
 * Returns the CSS variable matching the agent's theme color.
 */
export function getAgentColor(agentId: AgentId): string {
  const validAgents: AgentId[] = [
    'advocate',
    'challenger',
    'factchecker',
    'codeanalyst',
    'synthesizer',
    'orchestrator'
  ];
  if (validAgents.includes(agentId)) {
    return `var(--nx-${agentId})`;
  }
  return 'var(--nx-orchestrator)';
}

/**
 * Truncates node labels to 20 characters with ellipsis.
 */
export function truncateLabel(label: string): string {
  if (label.length > 20) {
    return label.substring(0, 17) + '...';
  }
  return label;
}

export default function GraphNodeComponent(_props: GraphNodeProps) {
  return null;
}