'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge, AgentId, EdgeType } from '@/types/nexus';
import { getAgentColor, truncateLabel } from './GraphNode';
import { getEdgeStyle } from './GraphEdge';

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  type: EdgeType;
  label?: string;
}

export interface NexusGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeAgents: AgentId[];
  onNodeClick?: (node: GraphNode) => void;
}

export default function NexusGraph({
  nodes,
  edges,
  activeAgents,
  onNodeClick
}: NexusGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);

  // 1. SIMULATION SETUP (run once on mount)
  useEffect(() => {
    // d3.forceSimulation with alphaDecay 0.02 (slow, floaty feel)
    const simulation = d3.forceSimulation<SimNode>()
      .alphaDecay(0.02)
      .force('charge', d3.forceManyBody().strength(-280))
      .force('link', d3.forceLink<SimNode, SimLink>().id(d => d.id).distance(130).strength(0.4))
      .force('collide', d3.forceCollide().radius(45));

    simulationRef.current = simulation;

    const svgElement = svgRef.current;
    if (svgElement) {
      // Set up zoom + pan on the SVG element
      const svg = d3.select<SVGSVGElement, unknown>(svgElement);
      const innerGroup = svg.select<SVGGElement>('.inner-group');

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
          innerGroup.attr('transform', event.transform);
        });

      svg.call(zoom);

      // ResizeObserver to update simulation center on parent container resize
      const parent = svgElement.parentElement || svgElement;
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width, height } = entries[0].contentRect;
        simulation.force('center', d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
      });

      resizeObserver.observe(parent);

      return () => {
        resizeObserver.disconnect();
        simulation.stop();
      };
    }

    return () => {
      simulation.stop();
    };
  }, []);

  // DRAG BEHAVIOR on nodes
  const getDragBehavior = (sim: d3.Simulation<SimNode, SimLink>) => {
    return d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  };

  // 2. ON NODES/EDGES CHANGE (useEffect watching [nodes, edges, activeAgents, onNodeClick])
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;

    // Get parent bounds for default center positioning
    let centerX = 300;
    let centerY = 300;
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        centerX = rect.width / 2;
        centerY = rect.height / 2;
      }
    }

    // Map the new nodes list to simulation node objects to preserve coords
    const existingNodesMap = new Map<string, SimNode>(
      simNodesRef.current.map(n => [n.id, n])
    );

    const nextSimNodes: SimNode[] = nodes.map(node => {
      const existing = existingNodesMap.get(node.id);
      return {
        ...node,
        x: existing?.x ?? node.x ?? (centerX + (Math.random() - 0.5) * 100),
        y: existing?.y ?? node.y ?? (centerY + (Math.random() - 0.5) * 100),
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        fx: existing?.fx ?? null,
        fy: existing?.fy ?? null
      };
    });

    simNodesRef.current = nextSimNodes;

    // Map links
    const nextSimLinks: SimLink[] = edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target
    }));

    // Update simulation
    sim.nodes(nextSimNodes);
    const linkForce = sim.force<d3.ForceLink<SimNode, SimLink>>('link');
    if (linkForce) {
      linkForce.links(nextSimLinks);
    }

    // Restart with alphaTarget(0.15) then alphaTarget(0)
    sim.alphaTarget(0.15).restart();
    const timeoutId = setTimeout(() => {
      sim.alphaTarget(0);
    }, 300);

    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgElement);
    const edgesGroup = svg.select<SVGGElement>('.edges-group');
    const nodesGroup = svg.select<SVGGElement>('.nodes-group');

    // ================= EDGE RENDERING =================
    const edgeLines = edgesGroup.selectAll<SVGLineElement, SimLink>('line')
      .data(nextSimLinks, d => d.id);

    // Exit
    edgeLines.exit().remove();

    // Enter
    const edgeLinesEnter = edgeLines.enter()
      .append('line')
      .attr('class', 'edge-line')
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Merge & Update properties
    const edgeLinesMerged = edgeLinesEnter.merge(edgeLines);

    edgeLinesMerged.each(function(d) {
      const style = getEdgeStyle(d.type);
      d3.select(this)
        .attr('stroke', style.stroke)
        .attr('stroke-opacity', style.opacity)
        .attr('stroke-width', style.width)
        .attr('marker-end', `url(#arrow-${d.type})`);
    });

    // Draw animation on enter (using stroke-dashoffset)
    edgeLinesEnter.each(function(d) {
      const style = getEdgeStyle(d.type);
      const el = d3.select(this);
      el.attr('stroke-dasharray', '200 200')
        .attr('stroke-dashoffset', 200)
        .transition()
        .duration(500)
        .attr('stroke-dashoffset', 0)
        .on('end', () => {
          el.attr('stroke-dasharray', style.dasharray);
        });
    });

    // ================= NODE RENDERING =================
    const nodeGroups = nodesGroup.selectAll<SVGGElement, SimNode>('.node-group')
      .data(nextSimNodes, d => d.id);

    // Exit (fade out)
    nodeGroups.exit()
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();

    // Enter
    const nodeGroupsEnter = nodeGroups.enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', onNodeClick ? 'pointer' : 'default')
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d);
      })
      .call(getDragBehavior(sim) as any);

    // Nested node-content to avoid tick/transition transform conflicts
    const nodeContentEnter = nodeGroupsEnter.append('g')
      .attr('class', 'node-content')
      .style('opacity', 0)
      .attr('transform', 'scale(0)');

    // a) Outer glow ring
    nodeContentEnter.append('circle')
      .attr('class', 'glow-ring')
      .attr('r', 36)
      .attr('fill', 'none')
      .attr('stroke-width', '0.5')
      .attr('opacity', '0.3');

    // b) Inner filled circle
    nodeContentEnter.append('circle')
      .attr('class', 'inner-circle')
      .attr('r', 24)
      .attr('fill-opacity', 0.12)
      .attr('stroke-width', '1.5');

    // c) Icon or letter
    nodeContentEnter.append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'Syne, sans-serif')
      .attr('font-weight', '700')
      .attr('font-size', '14px');

    // d) Label below
    nodeContentEnter.append('text')
      .attr('class', 'node-label')
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '10px')
      .attr('font-family', 'DM Mono, monospace');

    // e) Confidence ring (fact-checker confidence indication)
    nodeContentEnter.append('circle')
      .attr('class', 'confidence-ring')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', 'var(--nx-factchecker)')
      .attr('stroke-width', '2')
      .attr('transform', 'rotate(-90)');

    // Merge & Update Node Details
    const nodeGroupsMerged = nodeGroupsEnter.merge(nodeGroups);

    nodeGroupsMerged.each(function(d) {
      const el = d3.select(this);
      const color = getAgentColor(d.agentId);
      const isAgentActive = activeAgents.includes(d.agentId);

      // Outer glow ring
      el.select('.glow-ring')
        .attr('stroke', color)
        .attr('class', isAgentActive ? 'glow-ring pulsing-glow' : 'glow-ring');

      // Inner circle
      el.select('.inner-circle')
        .attr('stroke', color)
        .attr('fill', color);

      // Icon letter (capitalized first letter of node type)
      el.select('.node-icon')
        .attr('fill', color)
        .text(d.type.charAt(0).toUpperCase());

      // Label below
      el.select('.node-label')
        .text(truncateLabel(d.label));

      // Confidence ring
      el.select('.confidence-ring')
        .style('display', d.type === 'fact' ? 'block' : 'none')
        .attr('stroke-dasharray', () => {
          const confidence = d.confidence ?? 0;
          return `${confidence * 175.93} 175.93`;
        });
    });

    // Animate content scaling up on enter
    nodeContentEnter.transition()
      .duration(400)
      .style('opacity', 1)
      .attr('transform', 'scale(1)');

    // Update cursor style if click handler changes
    nodeGroupsMerged.style('cursor', onNodeClick ? 'pointer' : 'default');

    // ================= TICK EVENT LISTENER =================
    const edgeSelection = edgesGroup.selectAll<SVGLineElement, SimLink>('line');
    const nodeSelection = nodesGroup.selectAll<SVGGElement, SimNode>('.node-group');

    sim.on('tick', () => {
      edgeSelection
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0);

      nodeSelection
        .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [nodes, edges, activeAgents, onNodeClick]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      {/* Self-contained CSS injection for keyframe pulse animations */}
      <style>{`
        @keyframes glow-pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.65;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        .pulsing-glow {
          transform-origin: center;
          animation: glow-pulse 2s infinite ease-in-out;
          transform-box: fill-box;
        }
      `}</style>
      <svg ref={svgRef} className="w-full h-full block">
        <defs>
          <marker id="arrow-supports" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--nx-factchecker)" opacity="0.6"/>
          </marker>
          <marker id="arrow-rebuts" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--nx-challenger)" opacity="0.7"/>
          </marker>
          <marker id="arrow-verifies" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--nx-factchecker)" opacity="0.9"/>
          </marker>
          <marker id="arrow-contradicts" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--nx-challenger)" opacity="0.9"/>
          </marker>
          <marker id="arrow-depends" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--nx-codeanalyst)" opacity="0.5"/>
          </marker>
          <marker id="arrow-fixes" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--nx-factchecker)" opacity="0.7"/>
          </marker>
          <marker id="arrow-links" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(255,255,255,0.15)"/>
          </marker>
        </defs>
        <g className="inner-group">
          <g className="edges-group" />
          <g className="nodes-group" />
        </g>
      </svg>
    </div>
  );
}