import { useEffect, useRef, useState } from "react";
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

  return { simNodes, simEdges };
}
