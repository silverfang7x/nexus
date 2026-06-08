import { NexusMode, GraphNode } from '@/types/nexus';

export function generateMarkdownExport(
  mode: NexusMode,
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structuredOutput: any,
  nodes: GraphNode[],
  sessionId: string
): string {
  const timestamp = new Date().toLocaleString();
  const formattedMode = mode.toUpperCase();

  let md = `# NEXUS — ${formattedMode} Report\n`;
  md += `**Query:** ${query}  \n`;
  md += `**Session:** ${sessionId}  \n`;
  md += `**Generated:** ${timestamp}  \n`;
  md += `**Agents:** Advocate · Challenger · Fact-checker · Synthesizer\n\n`;
  md += `---\n\n`;

  // TLDR Section
  const tldr = structuredOutput?.tldr || '';
  md += `## TLDR\n${tldr}\n\n`;
  md += `---\n\n`;

  // Mode-specific sections
  if (mode === 'debate') {
    const pointsFor = (structuredOutput?.for || [])
      .map((point: string) => `- ${point}`)
      .join('\n');
    const pointsAgainst = (structuredOutput?.against || [])
      .map((point: string) => `- ${point}`)
      .join('\n');
    const verdict = structuredOutput?.verdict || '';

    md += `## Arguments For\n${pointsFor}\n\n`;
    md += `## Arguments Against\n${pointsAgainst}\n\n`;
    md += `## Verdict\n${verdict}\n\n`;
  } else if (mode === 'plan') {
    const problem = structuredOutput?.problem || '';
    const frontend = structuredOutput?.stack?.frontend || '—';
    const backend = structuredOutput?.stack?.backend || '—';
    const database = structuredOutput?.stack?.database || '—';
    const hosting = structuredOutput?.stack?.hosting || '—';

    const features = (structuredOutput?.features || [])
      .map((feat: string, i: number) => `${i + 1}. ${feat}`)
      .join('\n');
    const risks = (structuredOutput?.risks || [])
      .map((risk: string) => `> ${risk}`)
      .join('\n');
    const timeline = (structuredOutput?.timeline || [])
      .map((t: { week: number; milestone: string }) => `### Week ${t.week}: ${t.milestone}`)
      .join('\n\n');

    md += `## Problem\n${problem}\n\n`;
    md += `## Recommended Stack\n`;
    md += `| Layer | Technology |\n`;
    md += `|-------|-----------|\n`;
    md += `| Frontend | ${frontend} |\n`;
    md += `| Backend | ${backend} |\n`;
    md += `| Database | ${database} |\n`;
    md += `| Hosting | ${hosting} |\n\n`;
    md += `## Features\n${features}\n\n`;
    md += `## Risks\n${risks}\n\n`;
    md += `## Build Timeline\n${timeline}\n\n`;
  } else if (mode === 'research') {
    const findings = (structuredOutput?.findings || [])
      .map((f: { claim: string; source?: string; verified: boolean }) => {
        const status = f.verified ? 'Verified' : 'Unverified';
        const sourceStr = f.source ? ` (Source: ${f.source})` : '';
        return `- **[${status}]** ${f.claim}${sourceStr}`;
      })
      .join('\n');
    const contradictions = (structuredOutput?.contradictions || [])
      .map((c: string) => `- ${c}`)
      .join('\n');
    const consensus = structuredOutput?.consensus || '';

    md += `## Key Findings\n${findings}\n\n`;
    md += `## Contradictions\n${contradictions}\n\n`;
    md += `## Consensus\n${consensus}\n\n`;
  } else if (mode === 'code') {
    const issues = (structuredOutput?.issuesFound || [])
      .map((issue: { file: string; issue: string; severity?: string }) => {
        const severity = issue.severity ? issue.severity.toUpperCase() : '';
        return `| ${issue.file} | ${issue.issue} | ${severity} |`;
      })
      .join('\n');
    const suggestions = (structuredOutput?.suggestions || [])
      .map((s: string, i: number) => `${i + 1}. ${s}`)
      .join('\n');

    md += `## Issues Found\n`;
    md += `| File | Issue | Severity |\n`;
    md += `|------|-------|----------|\n`;
    md += `${issues}\n\n`;
    md += `## Suggestions\n${suggestions}\n\n`;
  }

  // Fallback / Extra content if structured parsing failed entirely but raw verdict text is available
  if (typeof structuredOutput === 'string' && structuredOutput.trim()) {
    md += `## Verdict Output\n${structuredOutput}\n\n`;
  }

  md += `---\n\n`;

  // Graph Data Section
  md += `## Graph Data\n`;
  md += `**Total nodes:** ${nodes.length}  \n`;

  // Calculate agent breakdown
  const agentNames: Record<string, string> = {
    advocate: 'Advocate',
    challenger: 'Challenger',
    factchecker: 'Fact-checker',
    codeanalyst: 'Code analyst',
    synthesizer: 'Synthesizer',
    orchestrator: 'Orchestrator',
  };

  const agentCounts: Record<string, number> = {};
  nodes.forEach((node) => {
    const agentId = node.agentId || 'unknown';
    agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
  });

  md += `**Node breakdown:**\n`;
  const breakdownList = Object.entries(agentCounts)
    .map(([agentId, count]) => {
      const name = agentNames[agentId] || agentId;
      return `- ${name}: ${count}`;
    })
    .join('\n');

  md += `${breakdownList || 'None'}\n\n`;

  md += `### All Nodes\n`;
  const nodesList = nodes
    .map((node) => {
      return `#### ${node.label}\n- **Agent:** ${node.agentId}\n- **Type:** ${node.type}\n- **Content:** ${node.content}`;
    })
    .join('\n\n');

  md += `${nodesList || 'No nodes generated.'}\n\n`;

  md += `---\n`;
  md += `*Generated by NEXUS — Autonomous Multi-Agent Intelligence Platform*\n`;

  return md;
}
