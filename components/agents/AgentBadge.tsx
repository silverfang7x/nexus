import { AgentId } from '@/types/nexus';
import { getAgentColor } from '../canvas/GraphNode';

export interface AgentBadgeProps {
  agentId: AgentId;
}

export function getAgentName(agentId: AgentId): string {
  switch (agentId) {
    case 'advocate': return 'ADVOCATE';
    case 'challenger': return 'CHALLENGER';
    case 'factchecker': return 'FACT CHECKER';
    case 'codeanalyst': return 'CODE ANALYST';
    case 'synthesizer': return 'SYNTHESIZER';
    case 'orchestrator': return 'ORCHESTRATOR';
    default:
      return String(agentId).toUpperCase();
  }
}

export default function AgentBadge({ agentId }: AgentBadgeProps) {
  const color = getAgentColor(agentId);
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px]"
      style={{
        borderColor: `rgba(255, 255, 255, 0.1)`,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        fontFamily: 'var(--nx-font-mono), monospace',
        color: 'rgba(255, 255, 255, 0.8)'
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ 
          backgroundColor: color, 
          boxShadow: `0 0 6px ${color}`
        }}
      />
      <span style={{ color }}>
        {getAgentName(agentId)}
      </span>
    </span>
  );
}