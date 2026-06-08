import { AgentEvent } from "@/types/nexus";
import { fetchRepoStructure } from "@/lib/github";
import { streamGroqResponse } from "@/lib/groq";
import crypto from 'crypto';

interface AnalysisIssue {
  line: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

interface FileAnalysisResult {
  file: string;
  issues: AnalysisIssue[];
  overallScore: number;
  summary: string;
}

function extractGitHubUrl(query: string): string {
  // Search for github.com URLs
  const urlRegex = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i;
  const match = query.match(urlRegex);
  if (match) {
    return match[0];
  }
  // Search for owner/repo format
  const ownerRepoRegex = /\b[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\b/;
  const matchOr = query.match(ownerRepoRegex);
  if (matchOr) {
    return matchOr[0];
  }
  return query.trim();
}

function getFileColor(filePath: string): string {
  const lowerPath = filePath.toLowerCase();
  const ext = lowerPath.split('.').pop() || '';
  if (ext === 'ts' || ext === 'tsx') {
    return 'var(--nx-codeanalyst)';
  }
  if (ext === 'json' || lowerPath.includes('config') || ext === 'yaml' || ext === 'yml') {
    return '#D4A017'; // amber
  }
  if (ext === 'md') {
    return 'rgba(255,255,255,0.35)'; // muted gray
  }
  return 'rgba(255,255,255,0.5)';
}

function parseJSONSafely(text: string): unknown {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
}

export async function runCodeMode(
  query: string,
  onEvent: (event: AgentEvent) => void
): Promise<string> {
  const repoUrl = extractGitHubUrl(query);

  // --- PHASE 1: Repo Fetcher ---
  onEvent({
    agentId: 'codeanalyst',
    type: 'thinking',
    payload: { text: "Fetching repo structure from GitHub..." },
    timestamp: Date.now()
  });

  const repo = await fetchRepoStructure(repoUrl);

  onEvent({
    agentId: 'codeanalyst',
    type: 'thinking',
    payload: { text: `Fetched ${repo.files.length} files. Mapping to graph nodes...` },
    timestamp: Date.now()
  });

  // Emit file nodes
  for (const file of repo.files) {
    const filename = file.path.split('/').pop() || file.path;
    onEvent({
      agentId: 'codeanalyst',
      type: 'node_created',
      payload: {
        node: {
          id: file.path,
          label: filename,
          type: 'file',
          agentId: 'codeanalyst',
          content: file.path,
          color: getFileColor(file.path),
          timestamp: Date.now()
        }
      },
      timestamp: Date.now()
    });
    // Visual typing delay
    await new Promise(resolve => setTimeout(resolve, 15));
  }

  // Scan imports and emit dependency edges
  for (const file of repo.files) {
    if (!file.content) continue;
    for (const otherFile of repo.files) {
      if (file.path === otherFile.path) continue;
      const otherBase = otherFile.path.split('/').pop()?.split('.')[0] || '';
      if (otherBase.length > 2) {
        const importRegex = new RegExp(`(import|require|from)\\s*['"\`].*\\b${otherBase}\\b`, 'i');
        if (importRegex.test(file.content)) {
          onEvent({
            agentId: 'codeanalyst',
            type: 'edge_created',
            payload: {
              edge: {
                id: crypto.randomUUID(),
                source: file.path,
                target: otherFile.path,
                type: 'depends'
              }
            },
            timestamp: Date.now()
          });
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      }
    }
  }

  // --- PHASE 2: Code Analyst LLM ---
  const allIssues: { file: string; issue: string; severity: 'high' | 'medium' | 'low'; suggestion: string }[] = [];
  const filesWithContent = repo.files.filter(f => f.content);

  for (const file of filesWithContent) {
    onEvent({
      agentId: 'codeanalyst',
      type: 'thinking',
      payload: { text: `Analyzing ${file.path} for issues...` },
      timestamp: Date.now()
    });

    const systemPrompt = `You are an expert code reviewer. Analyse the provided file and identify: 1) Any bugs or errors, 2) Performance issues, 3) Security concerns, 4) Code quality improvements. 
Be specific and concise. Format as JSON:
{
  "file": string,
  "issues": [{"line": string, "issue": string, "severity": "high"|"medium"|"low", "suggestion": string}],
  "overallScore": number 0-10,
  "summary": string
}
Respond with JSON only.`;

    let analysisOutput = '';
    await streamGroqResponse(
      systemPrompt,
      `File Path: ${file.path}\n\nContent:\n${file.content}`,
      (token) => {
        analysisOutput += token;
        onEvent({
          agentId: 'codeanalyst',
          type: 'streaming',
          payload: { token },
          timestamp: Date.now()
        });
      },
      (_full) => {
        onEvent({
          agentId: 'codeanalyst',
          type: 'complete',
          payload: { text: _full },
          timestamp: Date.now()
        });
      }
    );

    try {
      const parsed = parseJSONSafely(analysisOutput) as FileAnalysisResult;
      if (parsed && parsed.issues && Array.isArray(parsed.issues) && parsed.issues.length > 0) {
        // Update file node color to red because issues were found
        const filename = file.path.split('/').pop() || file.path;
        onEvent({
          agentId: 'codeanalyst',
          type: 'node_created',
          payload: {
            node: {
              id: file.path,
              label: filename,
              type: 'file',
              agentId: 'codeanalyst',
              content: file.path,
              color: '#E24B4A', // Red
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        });

        // Add issue child nodes
        for (const issue of parsed.issues) {
          const issueNodeId = crypto.randomUUID();
          const label = issue.issue.length > 20 ? issue.issue.substring(0, 17) + '...' : issue.issue;
          
          onEvent({
            agentId: 'codeanalyst',
            type: 'node_created',
            payload: {
              node: {
                id: issueNodeId,
                label,
                type: 'issue',
                agentId: 'codeanalyst',
                content: `File: ${file.path}\nLine: ${issue.line}\nSeverity: ${issue.severity.toUpperCase()}\n\nIssue:\n${issue.issue}\n\nSuggestion:\n${issue.suggestion}`,
                color: '#E24B4A',
                timestamp: Date.now()
              }
            },
            timestamp: Date.now()
          });

          // Connect issue node to the file node
          onEvent({
            agentId: 'codeanalyst',
            type: 'edge_created',
            payload: {
              edge: {
                id: crypto.randomUUID(),
                source: issueNodeId,
                target: file.path,
                type: 'rebuts' // Dotted red line
              }
            },
            timestamp: Date.now()
          });
          
          allIssues.push({
            file: file.path,
            issue: issue.issue,
            severity: issue.severity,
            suggestion: issue.suggestion
          });

          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
    } catch (err) {
      console.error(`Failed to parse analysis JSON for ${file.path}:`, err);
    }
  }

  // --- PHASE 3: Synthesizer ---
  onEvent({
    agentId: 'synthesizer',
    type: 'thinking',
    payload: { text: "Synthesizing review results..." },
    timestamp: Date.now()
  });

  const allIssuesSummary = allIssues.map(issue => 
    `- File: ${issue.file}\n  Issue: ${issue.issue}\n  Severity: ${issue.severity}\n  Suggestion: ${issue.suggestion}`
  ).join('\n');

  const synthSystemPrompt = `You are the Synthesizer agent. Synthesize the code review findings and overall repository structure into a final structured analysis report.
You MUST output a single valid JSON object matching this schema:
{
  "tldr": "A brief 1-2 sentence high-level summary of the codebase quality and main issues found.",
  "filesAnalysed": number of files analysed,
  "issuesFound": [
    {
      "file": "file path",
      "issue": "concise description of the bug/perf/security/quality issue",
      "severity": "high" | "medium" | "low"
    }
  ],
  "suggestions": [
    "actionable improvement suggestion 1",
    "actionable improvement suggestion 2"
  ],
  "verdict": "A detailed concluding analysis of the repository's status, architectural health, and next steps."
}
Respond with JSON only.`;

  const synthUserMessage = `Here is the repo structure and findings:
Owner: ${repo.owner}
Repo: ${repo.repo}
Default Branch: ${repo.defaultBranch}
Total files in tree: ${repo.totalFiles}
Languages: ${repo.languages.join(', ')}

Analysis findings per file:
${allIssuesSummary || "No critical issues identified."}
`;

  let synthOutput = '';
  await streamGroqResponse(
    synthSystemPrompt,
    synthUserMessage,
    (token) => {
      synthOutput += token;
      onEvent({
        agentId: 'synthesizer',
        type: 'streaming',
        payload: { token },
        timestamp: Date.now()
      });
    },
    (_full) => {
      onEvent({
        agentId: 'synthesizer',
        type: 'complete',
        payload: { text: _full },
        timestamp: Date.now()
      });
    }
  );

  let cleanSynthJson = synthOutput.trim();
  try {
    const parsed = parseJSONSafely(cleanSynthJson);
    cleanSynthJson = JSON.stringify(parsed);
  } catch {
    // If double parsing fails, try manual extract
    try {
      if (cleanSynthJson.startsWith('```')) {
        cleanSynthJson = cleanSynthJson.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();
      }
      const firstBrace = cleanSynthJson.indexOf('{');
      const lastBrace = cleanSynthJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanSynthJson = cleanSynthJson.substring(firstBrace, lastBrace + 1);
      }
    } catch {
      // Return as is
    }
  }

  return cleanSynthJson;
}