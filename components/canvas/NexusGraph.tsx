'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, GraphEdge, AgentId, EdgeType, NexusMode } from '@/types/nexus';
import { getAgentColor } from './GraphNode';
import LoadingOrbit from './LoadingOrbit';

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
  mode: NexusMode;
  status: 'idle' | 'running' | 'complete' | 'error' | 'ready_for_continuation';
}

export default function NexusGraph({
  nodes,
  edges,
  activeAgents,
  onNodeClick,
  selectedNodeId,
  mode,
  status
}: NexusGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const sizeRef = useRef({ width: 800, height: 600 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { width, height } = dimensions;
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

  // 1. SIMULATION SETUP (run once on mount or when mode changes)
  useEffect(() => {
    let currentWidth = 800;
    let currentHeight = 600;
    const svgElement = svgRef.current;
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      if (rect.width && rect.height) {
        currentWidth = rect.width;
        currentHeight = rect.height;
        sizeRef.current = { width: currentWidth, height: currentHeight };
        setDimensions({ width: currentWidth, height: currentHeight });
      }
    }

    const simulation = d3.forceSimulation<SimNode>()
      .alphaDecay(0.025)
      .velocityDecay(0.4)
      .force('link', d3.forceLink<SimNode, SimLink>()
        .id((d: SimNode) => d.id)
        .distance((link) => {
          const src = typeof link.source === 'object' ? (link.source as SimNode) : null;
          if (src && src.type === 'task') {
            return 55;
          }
          return 110;
        })
        .strength((link) => {
          const src = typeof link.source === 'object' ? (link.source as SimNode) : null;
          if (src && src.type === 'task') {
            return 0.9;
          }
          return 0.6;
        })
      )
      .force('charge', d3.forceManyBody()
        .strength(-220)
        .distanceMax(300)
      )
      .force('collision', d3.forceCollide<SimNode>()
        .radius((d) => {
          if (d.type === 'milestone') return 72;  // more space for week labels
          if (d.type === 'source') return 65;
          if (d.type === 'task') return 35;       // tighter spacing for tasks
          return 52;
        })
        .strength(0.85)
      )
      .force('x', d3.forceX<SimNode>(currentWidth / 2).strength(0.04))
      .force('y', d3.forceY<SimNode>(currentHeight * 0.45).strength(0.06));

    if (mode === 'debate') {
      // Advocate nodes (claims) pull to LEFT side
      simulation.force('debate-x', d3.forceX<SimNode>()
        .x((d: SimNode) => {
          if (d.agentId === 'advocate') return currentWidth * 0.28;
          if (d.agentId === 'challenger') return currentWidth * 0.72;
          if (d.agentId === 'synthesizer') return currentWidth * 0.50;
          return currentWidth * 0.50;
        })
        .strength((d: SimNode) => {
          if (d.agentId === 'synthesizer') return 0.03;
          return 0.12;  // strong enough to form clear clusters
        })
      );

      // All debate nodes pulled to vertical center
      simulation.force('debate-y', d3.forceY<SimNode>(currentHeight * 0.45)
        .strength(0.08)
      );

      // Remove the generic center force in debate mode
      simulation.force('center', null);
    } else {
      // Non-debate modes: use standard center force
      simulation.force('center', d3.forceCenter(currentWidth / 2, currentHeight / 2)
        .strength(0.06)
      );
      simulation.force('debate-x', null);
      simulation.force('debate-y', null);
    }

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
        setDimensions({ width: newWidth, height: newHeight });

        if (mode === 'debate') {
          simulation.force('debate-x', d3.forceX<SimNode>()
            .x((d: SimNode) => {
              if (d.agentId === 'advocate') return newWidth * 0.28;
              if (d.agentId === 'challenger') return newWidth * 0.72;
              if (d.agentId === 'synthesizer') return newWidth * 0.50;
              return newWidth * 0.50;
            })
            .strength((d: SimNode) => {
              if (d.agentId === 'synthesizer') return 0.03;
              return 0.12;
            })
          );
          simulation.force('debate-y', d3.forceY<SimNode>(newHeight * 0.45).strength(0.08));
          simulation.force('center', null);
        } else {
          simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2).strength(0.06));
          simulation.force('debate-x', null);
          simulation.force('debate-y', null);
        }

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
  }, [mode]);

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

    // Map links
    const nextSimLinks: SimLink[] = edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target
    }));

    if (mode === 'code') {
      interface TreeNode {
        id: string;
        name: string;
        type: string;
        children: TreeNode[];
        nodeRef?: SimNode;
      }

      const rootNode: TreeNode = { id: '__root__', name: 'Root', type: 'dir', children: [] };
      const treeNodeMap = new Map<string, TreeNode>();
      treeNodeMap.set('__root__', rootNode);

      // 1. Add files to the tree, creating directory nodes on the fly
      for (const node of nextSimNodes) {
        if (node.type !== 'file') continue;

        const parts = node.id.split('/');
        let currentParent = rootNode;
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (i === parts.length - 1) {
            // Leaf node
            const fileNode: TreeNode = {
              id: node.id,
              name: part,
              type: 'file',
              children: [],
              nodeRef: node
            };
            currentParent.children.push(fileNode);
            treeNodeMap.set(node.id, fileNode);
          } else {
            // Directory node
            let dirNode = treeNodeMap.get(currentPath);
            if (!dirNode) {
              dirNode = {
                id: currentPath,
                name: part,
                type: 'dir',
                children: []
              };
              currentParent.children.push(dirNode);
              treeNodeMap.set(currentPath, dirNode);
            }
            currentParent = dirNode;
          }
        }
      }

      // 2. Map issues to files
      const fileForIssue = new Map<string, string>();
      for (const edge of nextSimLinks) {
        if (edge.type === 'rebuts' || edge.type === 'links' || edge.type === 'fixes' || edge.type === 'depends') {
          const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as SimNode).id;
          const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as SimNode).id;
          
          const sourceNode = nextSimNodes.find(n => n.id === sourceId);
          const targetNode = nextSimNodes.find(n => n.id === targetId);

          if (sourceNode?.type === 'issue' && targetNode?.type === 'file') {
            fileForIssue.set(sourceId, targetId);
          } else if (targetNode?.type === 'issue' && sourceNode?.type === 'file') {
            fileForIssue.set(targetId, sourceId);
          }
        }
      }

      for (const node of nextSimNodes) {
        if (node.type !== 'issue') continue;
        const fileId = fileForIssue.get(node.id);
        const parentNode = fileId ? treeNodeMap.get(fileId) : rootNode;

        if (parentNode) {
          const issueNode: TreeNode = {
            id: node.id,
            name: node.label,
            type: 'issue',
            children: [],
            nodeRef: node
          };
          parentNode.children.push(issueNode);
          treeNodeMap.set(node.id, issueNode);
        }
      }

      // 3. Add other generic nodes
      for (const node of nextSimNodes) {
        if (node.type !== 'file' && node.type !== 'issue' && !treeNodeMap.has(node.id)) {
          const genericNode: TreeNode = {
            id: node.id,
            name: node.label,
            type: node.type,
            children: [],
            nodeRef: node
          };
          rootNode.children.push(genericNode);
          treeNodeMap.set(node.id, genericNode);
        }
      }

      // 4. Run tree layout
      const root = d3.hierarchy<TreeNode>(rootNode);
      const treeLayout = d3.tree<TreeNode>().size([height - 100, width - 240]);
      treeLayout(root);

      // 5. Update nextSimNodes coords and lock them
      root.each((d) => {
        if (d.data.nodeRef) {
          d.data.nodeRef.x = (d.y ?? 0) + 120;
          d.data.nodeRef.y = (d.x ?? 0) + 50;
          d.data.nodeRef.fx = d.data.nodeRef.x;
          d.data.nodeRef.fy = d.data.nodeRef.y;
        }
      });
    } else {
      // Release force lock
      for (const node of nextSimNodes) {
        node.fx = null;
        node.fy = null;
      }
    }

    simNodesRef.current = nextSimNodes;

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
      .attr('class', 'node-content');

    // a) Circle 1 — outer ambient glow
    nodeContentEnter.append('circle')
      .attr('class', 'glow-outer')
      .attr('r', 42)
      .attr('stroke', 'none');

    // a2) Circle 1b — rotating outer ring for synthesizer
    nodeContentEnter.append('circle')
      .attr('class', 'synthesis-ring')
      .attr('r', 42)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(127, 119, 221, 0.25)')
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '8 4')
      .style('display', 'none');

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

    // c2) Rect — rounded rectangle for files in code mode
    nodeContentEnter.append('rect')
      .attr('class', 'node-rect')
      .attr('x', -60)
      .attr('y', -16)
      .attr('width', 120)
      .attr('height', 32)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke-width', '1.5')
      .style('display', 'none');

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

    // g) Circle selection ring (white outer ring when node is selected)
    nodeContentEnter.append('circle')
      .attr('class', 'selection-ring')
      .attr('r', 46)
      .attr('fill', 'none')
      .attr('stroke-width', '2')
      .style('pointer-events', 'none');

    // g2) Rect selection border
    nodeContentEnter.append('rect')
      .attr('class', 'selection-rect')
      .attr('x', -64)
      .attr('y', -20)
      .attr('width', 128)
      .attr('height', 40)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', 'none')
      .attr('stroke-width', '2')
      .style('pointer-events', 'none')
      .style('display', 'none');

    // h) Continuation outer ring (small outer ring in a lighter shade)
    nodeContentEnter.append('circle')
      .attr('class', 'continuation-ring')
      .attr('r', 26)
      .attr('fill', 'none')
      .attr('stroke-width', '1')
      .style('pointer-events', 'none');

    // Merge & Update Node Details
    const nodeGroupsMerged = nodeGroupsEnter.merge(nodeGroups);

    nodeGroupsMerged.each(function(d) {
      const el = d3.select(this);
      const isTask = d.type === 'task';
      const color = isTask ? 'rgba(55, 138, 221, 0.7)' : (d.color || getAgentColor(d.agentId));
      const isAgentActive = activeAgents.includes(d.agentId);
      const isFile = d.type === 'file';
      const isIssue = d.type === 'issue';
      const isCodeMode = mode === 'code';

      const isSynthesisNode = d.agentId === 'synthesizer' && d.type === 'claim';

      // Circle 1 - outer ambient glow (hide for issues, tasks, or files in code mode)
      const glowOuter = el.select('.glow-outer')
        .style('display', (isIssue || isTask || (isCodeMode && isFile)) ? 'none' : 'block')
        .attr('fill', color)
        .attr('fill-opacity', isSynthesisNode ? 0.3 : 0.06);

      if (isSynthesisNode) {
        glowOuter.style('filter', 'drop-shadow(0px 0px 32px rgba(127, 119, 221, 0.5))');
      } else {
        glowOuter.style('filter', null);
      }

      // Circle 2 - mid ring (hide for issues, tasks, or files in code mode)
      const midRing = el.select('.glow-mid');
      midRing
        .attr('stroke', color)
        .attr('stroke-opacity', 0.4)
        .style('display', (isAgentActive && !isIssue && !isTask && !(isCodeMode && isFile)) ? 'block' : 'none');

      if (isAgentActive && !isIssue && !isTask && !(isCodeMode && isFile)) {
        midRing.style('animation', 'nx-pulse-ring 2s ease-out infinite');
        midRing.style('transform-origin', 'center');
        midRing.style('transform-box', 'fill-box');
      } else {
        midRing.style('animation', null);
      }

      // Circle 3 - inner circle (hide for files in code mode, adjust size for issues or tasks)
      const r = isSynthesisNode ? 30 : (isIssue ? 12 : (isTask ? 16 : 22));
      el.select('.inner-circle')
        .style('display', (isCodeMode && isFile) ? 'none' : 'block')
        .attr('r', r)
        .attr('fill', color)
        .attr('fill-opacity', isIssue ? 0.9 : 0.15)
        .attr('stroke', color)
        .attr('stroke-opacity', isTask ? 0.7 : 0.9)
        .attr('stroke-dasharray', isTask ? '3 2' : null);

      // Rect for files in code mode
      el.select('.node-rect')
        .style('display', (isCodeMode && isFile) ? 'block' : 'none')
        .attr('fill', color)
        .attr('fill-opacity', 0.15)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.9);

      // Text 1 - icon letter (adjust position/size dynamically)
      const truncatedLabel = d.label.length > 18 ? d.label.substring(0, 18) + '…' : d.label;
      let iconText = isIssue ? '!' : getNodeTypeLetter(d.type);
      if (isTask) {
        const match = d.label.match(/Day (\d+)/);
        iconText = match ? match[1] : 'T';
      }

      if (isCodeMode && isFile) {
        el.select('.node-icon')
          .attr('x', -48)
          .attr('y', 0)
          .attr('font-size', '13px')
          .attr('fill', color)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'central')
          .text(iconText);

        el.select('.node-label')
          .attr('x', -28)
          .attr('y', 0)
          .attr('font-size', '10px')
          .attr('fill', 'rgba(255, 255, 255, 0.85)')
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'central')
          .text(truncatedLabel);
      } else {
        el.select('.node-icon')
          .attr('x', 0)
          .attr('y', 0)
          .attr('font-size', isIssue ? '10px' : (isTask ? '10px' : '13px'))
          .attr('fill', (isIssue || isTask) ? '#ffffff' : color)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .text(iconText);

        el.select('.node-label')
          .attr('x', 0)
          .attr('y', isIssue ? 24 : (isTask ? 28 : 36))
          .attr('font-size', isTask ? '9px' : '10px')
          .attr('fill', 'rgba(255, 255, 255, 0.65)')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'alphabetic')
          .text(truncatedLabel);
      }

      // Confidence ring
      el.select('.confidence-ring')
        .style('display', d.type === 'fact' ? 'block' : 'none')
        .attr('stroke-dasharray', () => {
          const confidence = d.confidence ?? 0;
          return `${confidence * 175.93} 175.93`;
        });

      // Selection ring/rect
      const isSelected = d.id === selectedNodeId;
      
      // Selection ring: only for circles
      el.select('.selection-ring')
        .style('display', (isCodeMode && isFile) ? 'none' : 'block')
        .attr('r', isSynthesisNode ? 54 : (isTask ? 20 : 46))
        .attr('stroke', 'rgba(255,255,255,0.6)')
        .attr('stroke-opacity', isSelected ? 1 : 0)
        .style('transition', 'stroke-opacity 150ms');

      // Selection rect: only for code files
      el.select('.selection-rect')
        .style('display', (isCodeMode && isFile) ? 'block' : 'none')
        .attr('stroke', 'rgba(255,255,255,0.6)')
        .attr('stroke-opacity', isSelected ? 1 : 0)
        .style('transition', 'stroke-opacity 150ms');

      // Continuation ring
      const isContinuation = d.sessionIndex && d.sessionIndex > 0;
      el.select('.continuation-ring')
        .style('display', isContinuation ? 'block' : 'none')
        .attr('stroke', color)
        .attr('stroke-opacity', 0.5);

      // Synthesis rotating outer ring
      const synthesisRing = el.select('.synthesis-ring');
      if (isSynthesisNode) {
        synthesisRing
          .style('display', 'block')
          .style('animation', 'nx-rotate 8s linear infinite')
          .style('transform-origin', 'center')
          .style('transform-box', 'fill-box');
      } else {
        synthesisRing
          .style('display', 'none')
          .style('animation', null);
      }

      // Set node-content opacity based on sessionIndex if not entering
      if (!(this as SVGGElement & { __isEntering?: boolean }).__isEntering) {
        el.select('.node-content').style('opacity', isContinuation ? 0.85 : 1.0);
      }
    });

    // Set __isEntering flag on entering node group elements
    nodeGroupsEnter.each(function() {
      (this as SVGGElement & { __isEntering?: boolean }).__isEntering = true;
    });

    // Configure initial visual attributes for entering nodes
    nodeContentEnter.each(function(d) {
      const isContinuation = d.sessionIndex && d.sessionIndex > 0;
      const el = d3.select(this);
      
      if (isContinuation) {
        // Slide in from right edge (width - d.x)
        const startX = width - (d.x ?? 0);
        el.attr('transform', `translate(${startX}, 0) scale(1)`)
          .style('opacity', 0);
      } else {
        // Scale up from center
        el.attr('transform', 'translate(0, 0) scale(0)')
          .style('opacity', 0);
      }
    });

    // Animate content entrance transition (with spring easing and staggered delay)
    nodeContentEnter.transition()
      .delay((d) => {
        const index = nodes.findIndex(n => n.id === d.id);
        return Math.min(index * 80, 400);
      })
      .duration(500)
      .ease(d3.easeBackOut.overshoot(1.2))
      .style('opacity', (d) => (d.sessionIndex && d.sessionIndex > 0) ? 0.85 : 1.0)
      .attr('transform', 'translate(0, 0) scale(1)')
      .on('end', function() {
        const parent = this.parentNode as (SVGGElement & { __isEntering?: boolean }) | null;
        if (parent) {
          delete parent.__isEntering;
        }
      });

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
  }, [nodes, edges, activeAgents, onNodeClick, selectedNodeId, mode]);

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      data-mode={mode}
      style={{
        backgroundColor: 'var(--nx-canvas-tint)',
        backgroundImage: 'radial-gradient(var(--nx-canvas-grid) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        transition: 'background-color 0.4s ease, border-color 0.4s ease',
      }}
    >
      <AnimatePresence>
        {status === 'running' && nodes.length === 0 && (
          <motion.div
            key="loading-orbit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              pointerEvents: 'none'
            }}
          >
            <LoadingOrbit activeAgents={activeAgents} />
          </motion.div>
        )}
      </AnimatePresence>
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
          {mode === 'debate' && (
            <g className="debate-background-decorations" style={{ pointerEvents: 'none' }}>
              <text
                x={width * 0.15}
                y={60}
                fontSize={11}
                fontFamily="Syne, sans-serif"
                fontWeight={700}
                fill="rgba(232, 89, 60, 0.20)"
                letterSpacing="0.15em"
                textAnchor="middle"
              >
                FOR
              </text>
              <text
                x={width * 0.85}
                y={60}
                fontSize={11}
                fontFamily="Syne, sans-serif"
                fontWeight={700}
                fill="rgba(226, 75, 74, 0.20)"
                letterSpacing="0.15em"
                textAnchor="middle"
              >
                AGAINST
              </text>
              <line
                x1={width / 2}
                y1={40}
                x2={width / 2}
                y2={height - 40}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
                strokeDasharray="4 6"
              />
              <text
                x={width * 0.50}
                y={height - 30}
                fontSize={10}
                fontFamily="Syne, sans-serif"
                fontWeight={600}
                fill="rgba(127, 119, 221, 0.25)"
                letterSpacing="0.12em"
                textAnchor="middle"
              >
                SYNTHESIS
              </text>
            </g>
          )}
          <g className="edges-group" />
          <g className="nodes-group" />
        </g>
      </svg>
    </div>
  );
}