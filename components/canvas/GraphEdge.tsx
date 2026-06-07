import { GraphEdge, EdgeType } from '@/types/nexus';

export interface GraphEdgeProps {
  edge: GraphEdge;
}

export interface EdgeStyle {
  stroke: string;
  opacity: number;
  width: number;
  dasharray: string | null;
}

/**
 * Maps an EdgeType to its corresponding visual properties according to the design system.
 */
export function getEdgeStyle(type: EdgeType): EdgeStyle {
  switch (type) {
    case 'supports':
      return {
        stroke: 'var(--nx-factchecker)',
        opacity: 0.6,
        width: 1,
        dasharray: null
      };
    case 'rebuts':
      return {
        stroke: 'var(--nx-challenger)',
        opacity: 0.7,
        width: 1.5,
        dasharray: '4 2'
      };
    case 'verifies':
      return {
        stroke: 'var(--nx-factchecker)',
        opacity: 0.9,
        width: 1,
        dasharray: null
      };
    case 'contradicts':
      return {
        stroke: 'var(--nx-challenger)',
        opacity: 0.9,
        width: 2,
        dasharray: '2 2'
      };
    case 'depends':
      return {
        stroke: 'var(--nx-codeanalyst)',
        opacity: 0.5,
        width: 1,
        dasharray: null
      };
    case 'fixes':
      return {
        stroke: 'var(--nx-factchecker)',
        opacity: 0.7,
        width: 1.5,
        dasharray: null
      };
    case 'links':
    default:
      return {
        stroke: 'rgba(255,255,255,0.15)',
        opacity: 1.0, // base opacity baked into rgba color
        width: 0.5,
        dasharray: null
      };
  }
}

export default function GraphEdgeComponent(_props: GraphEdgeProps) {
  return null;
}