'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge, AgentId, EdgeType } from '@/types/nexus';
import { getAgentColor } from './GraphNode';

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  type: EdgeType;
  label?: string;
}

interface SVGLineElementWithEntering extends SVGLineElement {
  __entering?: boolean;
}

const getNodeTypeLetter = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'claim': return 'C';
    case 'rebuttal': return 'R';
    case 'fact': return 'F';
    case 'source': return 'S';
    case 'file': return 'F';
    case 'issue': return '!';
    case 'fix': return '✓';
    case 'feature': return '★';
    case 'risk': return '⚠';
    case 'milestone': return '◆';
    default: return type.charAt(0).toUpperCase();
  }
};

export interface NexusGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeAgents: AgentId[];
  onNodeClick?: (node: GraphNode | null) => void;
  /** ID of the currently selected node — triggers white selection ring */
  selectedNodeId?: string | null;
}

export default function NexusGraph({
  nodes,
  edges,
  activeAgents,
  onNodeClick,
  selectedNodeId
}: NexusGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const sizeRef = useRef({ width: 800, height: 600 });
  const hasFittedRef = useRef(false);

  // fitGraph function to transition viewport to fit all nodes
  const fitGraph = () => {
    const simNodes = simNodesRef.current;
    if (simNodes.length === 0 || !zoomRef.current || !svgRef.current) return;
    const { width, height } = sizeRef.current;
    const padding = 60;
    const xs = simNodes.map(n => n.x || 0);
    const ys = simNodes.map(n => n.y || 0);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const scale = Math.min(width / graphW, height / graphH, 1.5);
    const tx = width / 2 - scale * (minX + maxX) / 2;
    const ty = height / 2 - scale * (minY + maxY) / 2;
    d3.select(svgRef.current)
      .transition().duration(600)
      .call(zoomRef.current.transform, 
        d3.zoomIdentity.translate(tx, ty).scale(scale));
  };

  // 1. SIMULATION SETUP (run once on mount)
  useEffect(() => {
    let width = 800;
    let height = 600;
    const svgElement = svgRef.current;
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      if (rect.width && rect.height) {
        width = rect.width;
        height = rect.height;
        sizeRef.current = { width, height };
      }
    }

    const simulation = d3.forceSimulation<SimNode>()
      .alphaDecay(0.025)
      .velocityDecay(0.4)
      .force('link', d3.forceLink<SimNode, SimLink>()
        .id((d: SimNode) => d.id)
        .distance(110)
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody()
        .strength(-220)
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(width / 2, height / 2)
        .strength(0.08)
      )
      .force('collision', d3.forceCollide<SimNode>()
        .radius((d) => {
          if (d.type === 'milestone') return 72;  // more space for week labels
          if (d.type === 'source') return 65;
          return 52;
        })
        .strength(0.85)
      )
      .force('x', d3.forceX<SimNode>(width / 2).strength(0.04))
      .force('y', d3.forceY<SimNode>(height * 0.45).strength(0.06));

    simulationRef.current = simulation;

    if (svgElement) {
      // Set up zoom + pan on the SVG element
      const svg = d3.select<SVGSVGElement, unknown>(svgElement);
      const innerGroup = svg.select<SVGGElement>('.inner-group');

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
          innerGroup.attr('transform', event.transform);
        });

      zoomRef.current = zoom;
      svg.call(zoom);

      // ResizeObserver to update simulation center on parent container resize
      const parent = svgElement.parentElement || svgElement;
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width: newWidth, height: newHeight } = entries[0].contentRect;
        sizeRef.current = { width: newWidth, height: newHeight };
        simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.force('x', d3.forceX<SimNode>(newWidth / 2).strength(0.04));
        simulation.force('y', d3.forceY<SimNode>(newHeight * 0.45).strength(0.06));
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

    // Get width and height from sizeRef
    const { width, height } = sizeRef.current;

    // Map the new nodes list to simulation node objects to preserve coords
    const existingNodesMap = new Map<string, SimNode>(
      simNodesRef.current.map(n => [n.id, n])
    );

    const nextSimNodes: SimNode[] = nodes.map(node => {
      const existing = existingNodesMap.get(node.id);
      return {
        ...node,
        x: existing?.x ?? node.x ?? (width / 2 + (Math.random() - 0.5) * 80),
        y: existing?.y ?? node.y ?? (height / 2 + (Math.random() - 0.5) * 80),
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

    // Restart alpha on new nodes so they settle down after finding positions
    sim.alpha(0.4).restart();

    let fitTimeout: ReturnType<typeof setTimeout> | undefined;
    if (nodes.length > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true;
      fitTimeout = setTimeout(() => {
        fitGraph();
      }, 800);
    } else if (nodes.length === 0) {
      hasFittedRef.current = false;
    }

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

    // Enter & Draw animation
    const edgeLinesEnter = edgeLines.enter()
      .append('line')
      .attr('class', 'edge-line');

    // Merge & Update properties
    const edgeLinesMerged = edgeLinesEnter.merge(edgeLines);

    edgeLinesMerged.each(function(this: SVGLineElement, d) {
      const el = d3.select(this);
      
      let stroke = 'rgba(255, 255, 255, 0.15)';
      let opacity = 1.0;
      let strokeWidth = 1.0;
      let dasharray: string | null = null;
      let isAnimated = false;
      let markerId = 'arrow-default';

      switch (d.type) {
        case 'supports':
          stroke = '#1D9E75';
          opacity = 0.55;
          strokeWidth = 1;
          markerId = 'arrow-supports';
          break;
        case 'rebuts':
          stroke = '#E24B4A';
          opacity = 0.75;
          strokeWidth = 1.5;
          dasharray = '5 3';
          isAnimated = true;
          markerId = 'arrow-rebuts';
          break;
        case 'verifies':
          stroke = '#1D9E75';
          opacity = 0.9;
          strokeWidth = 1;
          markerId = 'arrow-verifies';
          break;
        case 'contradicts':
          stroke = '#E24B4A';
          opacity = 0.9;
          strokeWidth = 2;
          dasharray = '3 2';
          isAnimated = true;
          markerId = 'arrow-contradicts';
          break;
        case 'depends':
          stroke = '#378ADD';
          opacity = 0.5;
          strokeWidth = 1;
          markerId = 'arrow-default';
          break;
        case 'fixes':
          stroke = '#1D9E75';
          opacity = 0.7;
          strokeWidth = 1.5;
          markerId = 'arrow-supports';
          break;
        case 'links':
          stroke = 'rgba(255,255,255,0.12)';
          strokeWidth = 0.5;
          markerId = 'arrow-default';
          break;
      }

      el.attr('stroke', stroke)
        .attr('stroke-opacity', opacity)
        .attr('stroke-width', strokeWidth)
        .attr('marker-end', `url(#${markerId})`);

      if (!(this as SVGLineElementWithEntering).__entering) {
        if (dasharray) {
          el.attr('stroke-dasharray', dasharray);
        } else {
          el.attr('stroke-dasharray', null);
        }

        if (isAnimated) {
          el.style('animation', 'nx-dash 3s linear infinite');
        } else {
          el.style('animation', null);
        }
      }
    });

    edgeLinesEnter.each(function(this: SVGLineElementWithEntering, d) {
      const el = d3.select(this);
      this.__entering = true;

      let stroke = 'rgba(255, 255, 255, 0.15)';
      let opacity = 1.0;
      let strokeWidth = 1.0;
      let dasharray: string | null = null;
      let isAnimated = false;
      let markerId = 'arrow-default';

      switch (d.type) {
        case 'supports':
          stroke = '#1D9E75';
          opacity = 0.55;
          strokeWidth = 1;
          markerId = 'arrow-supports';
          break;
        case 'rebuts':
          stroke = '#E24B4A';
          opacity = 0.75;
          strokeWidth = 1.5;
          dasharray = '5 3';
          isAnimated = true;
          markerId = 'arrow-rebuts';
          break;
        case 'verifies':
          stroke = '#1D9E75';
          opacity = 0.9;
          strokeWidth = 1;
          markerId = 'arrow-verifies';
          break;
        case 'contradicts':
          stroke = '#E24B4A';
          opacity = 0.9;
          strokeWidth = 2;
          dasharray = '3 2';
          isAnimated = true;
          markerId = 'arrow-contradicts';
          break;
        case 'depends':
          stroke = '#378ADD';
          opacity = 0.5;
          strokeWidth = 1;
          markerId = 'arrow-default';
          break;
        case 'fixes':
          stroke = '#1D9E75';
          opacity = 0.7;
          strokeWidth = 1.5;
          markerId = 'arrow-supports';
          break;
        case 'links':
          stroke = 'rgba(255,255,255,0.12)';
          strokeWidth = 0.5;
          markerId = 'arrow-default';
          break;
      }

      el.attr('stroke', stroke)
        .attr('stroke-opacity', opacity)
        .attr('stroke-width', strokeWidth)
        .attr('marker-end', `url(#${markerId})`);

      const x1 = (d.source as SimNode).x ?? 0;
      const y1 = (d.source as SimNode).y ?? 0;
      const x2 = (d.target as SimNode).x ?? 0;
      const y2 = (d.target as SimNode).y ?? 0;
      
      el.attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2);

      const pathLength = this.getTotalLength();

      el.attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(500)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0)
        .on('end', function(this: SVGLineElementWithEntering) {
          delete this.__entering;
          if (dasharray) {
            d3.select(this).attr('stroke-dasharray', dasharray);
          } else {
            d3.select(this).attr('stroke-dasharray', null);
          }

          if (isAnimated) {
            d3.select(this).style('animation', 'nx-dash 3s linear infinite');
          } else {
            d3.select(this).style('animation', null);
          }
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
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
      .style('cursor', onNodeClick ? 'pointer' : 'default')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      })
      .on('mouseenter', function() {
        d3.select(this).select('.node-content')
          .style('transform', 'scale(1.15)')
          .style('transition', 'transform 150ms ease-out');
      })
      .on('mouseleave', function() {
        d3.select(this).select('.node-content')
          .style('transform', 'scale(1)')
          .style('transition', 'transform 150ms ease-out');
      })
      .call(getDragBehavior(sim) as unknown as (selection: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>) => void);

    // Nested node-content to avoid tick/transition transform conflicts
    const nodeContentEnter = nodeGroupsEnter.append('g')
      .attr('class', 'node-content')
      .style('opacity', 0)
      .attr('transform', 'scale(0.3)');

    // a) Circle 1 — outer ambient glow
    nodeContentEnter.append('circle')
      .attr('class', 'glow-outer')
      .attr('r', 42)
      .attr('stroke', 'none');

    // b) Circle 2 — mid ring (only when node's agentId is in activeAgents)
    nodeContentEnter.append('circle')
      .attr('class', 'glow-mid')
      .attr('r', 34)
      .attr('fill', 'none')
      .attr('stroke-width', '1');

    // c) Circle 3 — inner filled circle
    nodeContentEnter.append('circle')
      .attr('class', 'inner-circle')
      .attr('r', 22)
      .attr('stroke-width', '1.5');

    // d) Text 1 — type icon letter
    nodeContentEnter.append('text')
      .attr('class', 'node-icon')
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-family', 'var(--nx-font-display)')
      .attr('font-weight', '600')
      .attr('font-size', '13px');

    // e) Text 2 — label below
    nodeContentEnter.append('text')
      .attr('class', 'node-label')
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--nx-font-mono)')
      .attr('font-size', '10px')
      .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))');

    // f) Confidence ring (fact-checker confidence indication)
    nodeContentEnter.append('circle')
      .attr('class', 'confidence-ring')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', 'var(--nx-factchecker)')
      .attr('stroke-width', '2')
      .attr('transform', 'rotate(-90)');

    // g) Selection ring (white outer ring when node is selected)
    nodeContentEnter.append('circle')
      .attr('class', 'selection-ring')
      .attr('r', 46)
      .attr('fill', 'none')
      .attr('stroke-width', '2')
      .style('pointer-events', 'none');

    // Merge & Update Node Details
    const nodeGroupsMerged = nodeGroupsEnter.merge(nodeGroups);

    nodeGroupsMerged.each(function(d) {
      const el = d3.select(this);
      const color = getAgentColor(d.agentId);
      const isAgentActive = activeAgents.includes(d.agentId);

      // Circle 1 - outer ambient glow
      el.select('.glow-outer')
        .attr('fill', color)
        .attr('fill-opacity', 0.06);

      // Circle 2 - mid ring
      const midRing = el.select('.glow-mid');
      midRing
        .attr('stroke', color)
        .attr('stroke-opacity', 0.4)
        .style('display', isAgentActive ? 'block' : 'none');

      if (isAgentActive) {
        midRing.style('animation', 'nx-pulse-ring 2s ease-out infinite');
        midRing.style('transform-origin', 'center');
        midRing.style('transform-box', 'fill-box');
      } else {
        midRing.style('animation', null);
      }

      // Circle 3 - inner circle
      el.select('.inner-circle')
        .attr('fill', color)
        .attr('fill-opacity', 0.15)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.9);

      // Text 1 - icon letter
      el.select('.node-icon')
        .attr('fill', color)
        .text(getNodeTypeLetter(d.type));

      // Text 2 - label below
      const truncatedLabel = d.label.length > 18 ? d.label.substring(0, 18) + '…' : d.label;
      el.select('.node-label')
        .attr('fill', 'rgba(255, 255, 255, 0.65)')
        .text(truncatedLabel);

      // Confidence ring
      el.select('.confidence-ring')
        .style('display', d.type === 'fact' ? 'block' : 'none')
        .attr('stroke-dasharray', () => {
          const confidence = d.confidence ?? 0;
          return `${confidence * 175.93} 175.93`;
        });

      // Selection ring: white with 0.6 opacity when selected
      const isSelected = d.id === selectedNodeId;
      el.select('.selection-ring')
        .attr('stroke', 'rgba(255,255,255,0.6)')
        .attr('stroke-opacity', isSelected ? 1 : 0)
        .style('transition', 'stroke-opacity 150ms');
    });

    // Animate content scaling up on enter
    nodeContentEnter.transition()
      .duration(350)
      .ease(d3.easeBackOut.overshoot(1.4))
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
      if (fitTimeout) {
        clearTimeout(fitTimeout);
      }
    };
  }, [nodes, edges, activeAgents, onNodeClick, selectedNodeId]);

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
      <svg 
        ref={svgRef} 
        className="w-full h-full block"
        onClick={(event) => {
          if (event.target === svgRef.current) {
            onNodeClick?.(null);
          }
        }}
      >
        <defs>
          <marker id="arrow-supports" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1D9E75"/>
          </marker>
          <marker id="arrow-rebuts" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#E24B4A"/>
          </marker>
          <marker id="arrow-verifies" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1D9E75"/>
          </marker>
          <marker id="arrow-contradicts" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#E24B4A"/>
          </marker>
          <marker id="arrow-default" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(255, 255, 255, 0.3)"/>
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