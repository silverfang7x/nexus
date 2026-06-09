import { NexusMode, GraphNode, GraphEdge } from '@/types/nexus';

export function exportToMarkdown(session: {
  query: string;
  mode: NexusMode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  verdict: string;
  timestamp: number;
}): string {
  const dateObj = new Date(session.timestamp);
  const date = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const cleanQuery = session.query.replace('--mock', '').trim();
  const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = null;
  try {
    parsed = JSON.parse(session.verdict);
  } catch {
    // If it's not valid JSON, we will treat it as a raw string
  }

  const nodeCount = session.nodes.length;
  const edgeCount = session.edges.length;

  if (session.mode === 'plan') {
    // Extract project name from the first feature node or TLDR
    const firstFeature = session.nodes.find((n) => n.type === 'feature');
    const projectName = firstFeature?.label || parsed?.tldr || cleanQuery;

    // TLDR
    const fullVerdictText = parsed?.verdict || session.verdict || '';
    const firstLineOfVerdict = parsed?.tldr || fullVerdictText.split('\n')[0] || '';

    // The Problem
    const problemNodes = session.nodes.filter(
      (n) =>
        n.type === 'feature' &&
        ['core problem', 'target user', 'pain point'].includes(n.label.toLowerCase())
    );
    const problemText =
      problemNodes.length > 0
        ? problemNodes.map((n) => n.content).join('\n\n')
        : parsed?.problem || 'No core problem description available.';

    // Tech Stack Table
    const stackNodes = session.nodes.filter(
      (n) => n.type === 'milestone' && n.agentId === 'codeanalyst'
    );
    stackNodes.sort((a, b) => a.timestamp - b.timestamp);

    const layerNames = [
      'Frontend',
      'Backend',
      'Database',
      'Authentication',
      'Deployment',
    ];

    let tableRows = '';
    if (stackNodes.length > 0) {
      tableRows = stackNodes
        .map((node, i) => {
          const layer = layerNames[i] || 'Hosting';
          const parts = node.content.split(/[—–-]/);
          const tech = parts[0]?.trim() || node.label;
          const why = parts.slice(1).join('—').trim() || node.content;
          return `| ${layer} | ${tech} | ${why} |`;
        })
        .join('\n');
    } else {
      const frontend = parsed?.stack?.frontend || '—';
      const backend = parsed?.stack?.backend || '—';
      const database = parsed?.stack?.database || '—';
      const hosting = parsed?.stack?.hosting || '—';
      tableRows =
        `| Frontend | ${frontend} | Recommended frontend framework. |\n` +
        `| Backend | ${backend} | Recommended backend API framework. |\n` +
        `| Database | ${database} | Recommended database layer. |\n` +
        `| Hosting / Deploy | ${hosting} | Recommended hosting platform. |`;
    }

    // Core Features
    const features = session.nodes.filter((n) => n.type === 'feature');
    const coreFeaturesList =
      features.length > 0
        ? features.map((n, idx) => `${idx + 1}. **${n.label}**: ${n.content}`).join('\n')
        : (parsed?.features || []).map((f: string, i: number) => `${i + 1}. ${f}`).join('\n') ||
          'No features specified.';

    // Risks to Watch
    const riskNodes = session.nodes.filter((n) => n.type === 'risk');
    const risksContent =
      riskNodes.length > 0
        ? riskNodes.map((n) => `> ⚠ **${n.label}**: ${n.content}`).join('\n\n')
        : (parsed?.risks || []).map((r: string) => `> ⚠ ${r}`).join('\n\n') ||
          'No risks identified.';

    // Build Timeline
    const weekNodes = session.nodes.filter(
      (n) =>
        n.type === 'milestone' &&
        n.agentId === 'synthesizer' &&
        n.label.toLowerCase().startsWith('week')
    );
    weekNodes.sort((a, b) => {
      const aMatch = a.label.match(/Week\s*(\d+)/i);
      const bMatch = b.label.match(/Week\s*(\d+)/i);
      const aNum = aMatch ? parseInt(aMatch[1], 10) : 0;
      const bNum = bMatch ? parseInt(bMatch[1], 10) : 0;
      return aNum - bNum;
    });

    let timelineContent = '';
    if (weekNodes.length > 0) {
      timelineContent = weekNodes
        .map((weekNode) => {
          const tasks = session.nodes.filter(
            (n) => n.type === 'task' && n.parentId === weekNode.id
          );
          tasks.sort((a, b) => {
            const aMatch = a.label.match(/Day\s*(\d+)/i);
            const bMatch = b.label.match(/Day\s*(\d+)/i);
            const aNum = aMatch ? parseInt(aMatch[1], 10) : 0;
            const bNum = bMatch ? parseInt(bMatch[1], 10) : 0;
            return aNum - bNum;
          });

          let taskList = '';
          if (tasks.length > 0) {
            taskList = tasks
              .map((t) => {
                if (t.label.toLowerCase().startsWith('day')) {
                  return `- [ ] ${t.label} — ${t.content}`;
                } else {
                  const dayMatch = t.label.match(/Day\s*(\d+)/i);
                  const dayNum = dayMatch ? dayMatch[1] : '1';
                  return `- [ ] Day ${dayNum}: ${t.label} — ${t.content}`;
                }
              })
              .join('\n');
          } else {
            taskList = 'Tasks not yet generated';
          }

          return `### ${weekNode.label}\n${weekNode.content}\n\n**Daily Tasks:**\n${taskList}`;
        })
        .join('\n\n');
    } else {
      timelineContent =
        (parsed?.timeline || [])
          .map((t: { week: number; milestone: string }) => {
            return `### Week ${t.week}\n${t.milestone}\n\n**Daily Tasks:**\nTasks not yet generated`;
          })
          .join('\n\n') || 'No timeline available.';
    }

    // Full Analysis
    const paragraphs = fullVerdictText
      .split('\n\n')
      .filter(Boolean)
      .map((p: string) => p.trim())
      .join('\n\n');

    return `# ${projectName}
> Generated by NEXUS on ${date} · Plan mode

## TLDR
${firstLineOfVerdict}

---

## The Problem
${problemText}

## Recommended Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
${tableRows}

## Core Features
${coreFeaturesList}

## Risks to Watch
${risksContent}

## Build Timeline

${timelineContent}

## Full Analysis
${paragraphs}

---
*Generated by NEXUS · ${nodeCount} reasoning nodes · ${edgeCount} connections · Session ${sessionId}*
*Query: "${cleanQuery}"*
`;
  }

  if (session.mode === 'debate') {
    let forNodes = session.nodes.filter(
      (n) => n.type === 'claim' && n.agentId === 'advocate'
    );
    if (forNodes.length === 0) {
      forNodes = session.nodes.filter((n) => n.agentId === 'advocate');
    }
    const forList =
      forNodes.length > 0
        ? forNodes.map((n, i) => `${i + 1}. **${n.label}**: ${n.content}`).join('\n')
        : (parsed?.for || []).map((f: string, i: number) => `${i + 1}. ${f}`).join('\n') ||
          'No arguments for.';

    let againstNodes = session.nodes.filter(
      (n) => n.type === 'rebuttal' && n.agentId === 'challenger'
    );
    if (againstNodes.length === 0) {
      againstNodes = session.nodes.filter((n) => n.agentId === 'challenger');
    }
    const againstList =
      againstNodes.length > 0
        ? againstNodes.map((n, i) => `${i + 1}. **${n.label}**: ${n.content}`).join('\n')
        : (parsed?.against || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n') ||
          'No arguments against.';

    const fullVerdict = parsed?.verdict || session.verdict || 'No verdict generated.';

    return `# Debate: ${cleanQuery}
> Generated by NEXUS on ${date} · Debate mode

## The Question
${cleanQuery}

## Arguments FOR
${forList}

## Arguments AGAINST
${againstList}

## Verdict
${fullVerdict}

## Reasoning Graph
${nodeCount} claims analysed · ${edgeCount} connections mapped

---
*Generated by NEXUS*
`;
  }

  if (session.mode === 'research') {
    const sourceNodes = session.nodes.filter((n) => n.type === 'source');
    const questionsList =
      sourceNodes.length > 0
        ? sourceNodes.map((n, i) => `${i + 1}. ${n.content || n.label}`).join('\n')
        : parsed?.tldr
        ? `1. ${parsed.tldr}`
        : 'No questions recorded.';

    const factNodes = session.nodes.filter((n) => n.type === 'fact');
    let findingsList = '';
    if (factNodes.length > 0) {
      findingsList = factNodes
        .map((n) => {
          const confidence = n.confidence ?? 1.0;
          const confLabel = confidence > 0.8 ? 'HIGH' : confidence > 0.5 ? 'MEDIUM' : 'LOW';
          return `**${n.label}** (Confidence: ${confLabel})\n${n.content}`;
        })
        .join('\n\n');
    } else if (parsed?.findings && Array.isArray(parsed.findings)) {
      findingsList = parsed.findings
        .map((f: { claim: string; source?: string }) => {
          return `**${f.claim}**\n${f.source ? `*Source:* ${f.source}` : ''}`;
        })
        .join('\n\n');
    } else {
      findingsList = 'No findings recorded.';
    }

    const synthesisText =
      parsed?.verdict || parsed?.consensus || session.verdict || 'No synthesis available.';

    return `# Research: ${cleanQuery}
> Generated by NEXUS on ${date} · Research mode

## Key Questions Explored
${questionsList}

## Findings
${findingsList}

## Synthesis
${synthesisText}

---
*Generated by NEXUS*
`;
  }

  // Fallback for code mode or other modes
  const issues = (parsed?.issuesFound || [])
    .map((issue: { file: string; issue: string; severity?: string }) => {
      const severity = issue.severity ? issue.severity.toUpperCase() : 'MEDIUM';
      return `| ${issue.file} | ${issue.issue} | ${severity} |`;
    })
    .join('\n');

  const suggestions = (parsed?.suggestions || [])
    .map((s: string, i: number) => `${i + 1}. ${s}`)
    .join('\n');

  const rawVerdict = parsed?.verdict || session.verdict || '';

  return `# Code Analysis: ${cleanQuery}
> Generated by NEXUS on ${date} · Code mode

## Issues Found
| File | Issue | Severity |
|------|-------|----------|
${issues || '| None | No issues detected. | — |'}

## Suggestions
${suggestions || 'No specific suggestions recorded.'}

## Synthesis
${rawVerdict}

---
*Generated by NEXUS · ${nodeCount} reasoning nodes · ${edgeCount} connections*
`;
}

export function generateMarkdownExport(
  mode: NexusMode,
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structuredOutput: any,
  nodes: GraphNode[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _sessionId: string
): string {
  return exportToMarkdown({
    query,
    mode,
    nodes,
    edges: [],
    verdict: typeof structuredOutput === 'string' ? structuredOutput : JSON.stringify(structuredOutput),
    timestamp: Date.now()
  });
}
