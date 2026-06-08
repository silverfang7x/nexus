export interface RepoFile {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  url?: string;
  content?: string;  // only for small files we fetch
}

export interface RepoStructure {
  owner: string;
  repo: string;
  defaultBranch: string;
  files: RepoFile[];
  totalFiles: number;
  languages: string[];
}

/**
 * Helper to parse GitHub URL formats:
 * - github.com/owner/repo
 * - https://github.com/owner/repo
 * - owner/repo
 * Handles trailing slashes and trailing .git extension.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  let clean = url.trim();
  // Strip protocol and www.github.com/ or github.com/
  clean = clean.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
  // Strip trailing .git and trailing slash
  clean = clean.replace(/\.git\/?$/, '').replace(/\/$/, '');

  const parts = clean.split('/');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error("Invalid GitHub URL format. Use 'owner/repo' or 'https://github.com/owner/repo'");
}

function getFilePriority(filePath: string): number {
  const lowerPath = filePath.toLowerCase();
  const fileName = lowerPath.split('/').pop() || '';

  // 1. Root README.md has highest priority
  if (fileName === 'readme.md') {
    return 100;
  }

  // 2. Root config files (package.json, tsconfig.json, next.config.js, tailwind.config.js, etc.)
  if (!filePath.includes('/')) {
    if (fileName === 'package.json') return 95;
    if (fileName.includes('config') || fileName.startsWith('tsconfig') || fileName.startsWith('jsconfig')) {
      return 90;
    }
  }

  // 3. Source files inside src/, lib/, or app/
  if (filePath.startsWith('src/') || filePath.startsWith('lib/') || filePath.startsWith('app/')) {
    if (/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|css|html)$/i.test(fileName)) {
      return 80;
    }
    return 70;
  }

  // 4. Other code/source files
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|css|html)$/i.test(fileName)) {
    return 50;
  }

  return 10;
}

function detectLanguage(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'TypeScript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'JavaScript';
    case 'json':
      return 'JSON';
    case 'md':
      return 'Markdown';
    case 'py':
      return 'Python';
    case 'go':
      return 'Go';
    case 'rs':
      return 'Rust';
    case 'java':
      return 'Java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'C++';
    case 'c':
    case 'h':
      return 'C';
    case 'cs':
      return 'C#';
    case 'rb':
      return 'Ruby';
    case 'php':
      return 'PHP';
    case 'css':
      return 'CSS';
    case 'html':
      return 'HTML';
    case 'sh':
      return 'Shell';
    case 'yml':
    case 'yaml':
      return 'YAML';
    default:
      return null;
  }
}

export async function fetchRepoStructure(repoUrl: string): Promise<RepoStructure> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'NEXUS-Code-Analyst'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // Helper to handle error responses
  const handleError = async (res: Response) => {
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
    let isRateLimit = res.status === 429 || (res.status === 403 && rateLimitRemaining === '0');

    try {
      const data = await res.json();
      if (data?.message?.toLowerCase().includes('rate limit') || data?.message?.toLowerCase().includes('exceeded')) {
        isRateLimit = true;
      }
    } catch {
      // Ignored
    }

    if (isRateLimit) {
      throw new Error("GitHub rate limit hit. Try again in 60s");
    }
    if (res.status === 404) {
      throw new Error("Repository not found");
    }
    if (res.status === 403 || res.status === 401) {
      throw new Error("Repository is private");
    }
    throw new Error(`GitHub API error (Status ${res.status})`);
  };

  // 1. Fetch Repository Metadata
  const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoMetaRes.ok) {
    await handleError(repoMetaRes);
  }

  const repoMeta = await repoMetaRes.json();
  const defaultBranch = repoMeta.default_branch || 'main';

  // 2. Fetch Repository Tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
  if (!treeRes.ok) {
    await handleError(treeRes);
  }

  const treeData = await treeRes.json();

  interface GitHubTreeItem {
    path: string;
    type: string;
    size?: number;
    url?: string;
  }

  const rawFiles: GitHubTreeItem[] = treeData.tree || [];

  // 3. Filter files
  // Skip: node_modules, .git, lock files, images, fonts, media, and folders themselves (directories)
  const filteredFiles = rawFiles.filter((item: GitHubTreeItem) => {
    if (item.type !== 'blob') return false; // We only want files (blobs), not trees/directories in this lists
    
    const path = item.path;
    const lowerPath = path.toLowerCase();
    
    // Skip node_modules, .git, or temporary build/dist folders
    if (lowerPath.includes('node_modules/') || lowerPath.startsWith('.git/') || lowerPath.includes('/.git/')) {
      return false;
    }
    
    // Skip lock files
    if (
      lowerPath.endsWith('package-lock.json') ||
      lowerPath.endsWith('yarn.lock') ||
      lowerPath.endsWith('pnpm-lock.yaml') ||
      lowerPath.endsWith('composer.lock') ||
      lowerPath.endsWith('gemfile.lock') ||
      lowerPath.endsWith('cargo.lock')
    ) {
      return false;
    }
    
    // Skip images & fonts & media & binaries
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const excludedExtensions = [
      'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', // Images
      'woff', 'woff2', 'ttf', 'eot', 'otf',              // Fonts
      'mp4', 'webm', 'ogg', 'mp3', 'wav',                // Media
      'pdf', 'zip', 'gz', 'tar', 'tgz', 'rar', '7z',     // Compressed
      'exe', 'dll', 'so', 'dylib', 'bin', 'out'          // Binaries
    ];
    if (excludedExtensions.includes(ext)) {
      return false;
    }

    return true;
  });

  // Sort by priority score descending
  filteredFiles.sort((a, b) => getFilePriority(b.path) - getFilePriority(a.path));

  // Limit to max 50 files
  const topFiles = filteredFiles.slice(0, 50);

  // Map to RepoFile interface
  const files: RepoFile[] = topFiles.map((item: GitHubTreeItem) => ({
    path: item.path,
    type: 'file',
    size: item.size,
    url: item.url
  }));

  // 4. Fetch content for the top 8 most important files
  const top8Files = files.slice(0, 8);
  await Promise.all(
    top8Files.map(async (file) => {
      try {
        const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, { headers });
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData && contentData.encoding === 'base64' && contentData.content) {
            // Clean content string of any whitespace/newlines before base64 decode
            const cleanBase64 = contentData.content.replace(/\s/g, '');
            const decoded = Buffer.from(cleanBase64, 'base64').toString('utf8');
            // Truncate to 3000 characters
            file.content = decoded.length > 3000 ? decoded.substring(0, 3000) + '\n... [TRUNCATED]' : decoded;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch content for file ${file.path}:`, err);
      }
    })
  );

  // 5. Gather detected languages
  const languageSet = new Set<string>();
  files.forEach(file => {
    const lang = detectLanguage(file.path);
    if (lang) {
      languageSet.add(lang);
    }
  });

  return {
    owner,
    repo,
    defaultBranch,
    files,
    totalFiles: rawFiles.filter(item => item.type === 'blob').length,
    languages: Array.from(languageSet)
  };
}
