import { useEffect, useRef, useState, useCallback } from "react";
import { forceSimulation, forceManyBody, forceLink, forceCenter, Simulation, SimulationNodeDatum, SimulationLinkDatum } from "d3";
import { GraphNode, GraphEdge } from "@/types/nexus";

export interface SimNode extends GraphNode, SimulationNodeDatum {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface SimEdge extends Omit<GraphEdge, 'source' | 'target'>, SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export function useGraph(nodes: GraphNode[], edges: GraphEdge[]) {
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simEdges, setSimEdges] = useState<SimEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const simulationRef = useRef<Simulation<SimNode, SimEdge> | null>(null);

  useEffect(() => {
    // Stop previous simulation if exists
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Map new nodes and edges so D3 can mutate them without modifying the original state directly
    const mappedNodes: SimNode[] = nodes.map(n => ({ ...n }));
    const mappedEdges: SimEdge[] = edges.map(e => ({ ...e }));

    const simulation = forceSimulation<SimNode, SimEdge>(mappedNodes)
      .force("charge", forceManyBody().strength(-200))
      .force("link", forceLink<SimNode, SimEdge>(mappedEdges).id((d) => d.id).distance(120))
      .force("center", forceCenter(400, 300))
      .on("tick", () => {
        // Create new arrays to trigger React state updates
        setSimNodes([...simulation.nodes()]);
        setSimEdges([...mappedEdges]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  /** Returns all nodes connected to nodeId by any edge */
  const getConnectedNodes = useCallback(
    (nodeId: string): GraphNode[] => {
      const connectedIds = new Set<string>();
      for (const edge of edges) {
        const src =
          typeof edge.source === 'object' && edge.source !== null && 'id' in edge.source
            ? (edge.source as { id: string }).id
            : (edge.source as string);
        const tgt =
          typeof edge.target === 'object' && edge.target !== null && 'id' in edge.target
            ? (edge.target as { id: string }).id
            : (edge.target as string);
        if (src === nodeId) connectedIds.add(tgt);
        if (tgt === nodeId) connectedIds.add(src);
      }
      return nodes.filter((n) => connectedIds.has(n.id));
    },
    [nodes, edges]
  );

  /** Returns all edges connected to nodeId */
  const getConnectedEdges = useCallback(
    (nodeId: string): GraphEdge[] => {
      return edges.filter((edge) => {
        const src =
          typeof edge.source === 'object' && edge.source !== null && 'id' in edge.source
            ? (edge.source as { id: string }).id
            : (edge.source as string);
        const tgt =
          typeof edge.target === 'object' && edge.target !== null && 'id' in edge.target
            ? (edge.target as { id: string }).id
            : (edge.target as string);
        return src === nodeId || tgt === nodeId;
      });
    },
    [edges]
  );

  return { simNodes, simEdges, selectedNode, setSelectedNode, getConnectedNodes, getConnectedEdges };
}
