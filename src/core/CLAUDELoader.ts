/**
 * CLAUDE.md Loader
 * Auto-discover and load CLAUDE.md from workspace hierarchy
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

export interface CLAUDEMetadata {
  title?: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
}

export interface CLAUDESection {
  level: number;
  title: string;
  content: string;
}

export interface CLAUDEContent {
  path: string;
  metadata: CLAUDEMetadata;
  sections: CLAUDESection[];
  raw: string;
}

/**
 * Parse CLAUDE.md metadata from frontmatter
 */
function parseMetadata(content: string): { metadata: CLAUDEMetadata; body: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { metadata: {}, body: content };
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  const metadata: CLAUDEMetadata = {};

  // Simple YAML-like parsing
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (key === 'tags') {
        metadata.tags = value.split(',').map(t => t.trim());
      } else {
        (metadata as Record<string, string>)[key] = value.trim();
      }
    }
  }

  return { metadata, body };
}

/**
 * Parse CLAUDE.md sections
 */
function parseSections(body: string): CLAUDESection[] {
  const sections: CLAUDESection[] = [];
  const lines = body.split('\n');
  
  let currentSection: CLAUDESection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      
      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      currentSection = { level, title, content: '' };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Don't forget last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Load a single CLAUDE.md file
 */
export function loadCLAUDEFile(filePath: string): CLAUDEContent | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    const raw = readFileSync(filePath, 'utf-8');
    const { metadata, body } = parseMetadata(raw);
    const sections = parseSections(body);

    return {
      path: filePath,
      metadata,
      sections,
      raw
    };
  } catch (error) {
    console.error(`[CLAUDE Loader] Failed to load ${filePath}:`, error);
    return null;
  }
}

/**
 * Find all CLAUDE.md files in directory hierarchy
 * Returns files from root to current (parent to child order)
 */
export function findCLAUDEFiles(startPath: string, rootPath?: string): string[] {
  const files: string[] = [];
  const resolvedStart = resolve(startPath);
  const resolvedRoot = rootPath ? resolve(rootPath) : getGitRoot(resolvedStart) || resolvedStart;

  let currentDir = resolvedStart;
  const collected: string[] = [];

  // Walk up from start to root, collecting paths
  while (currentDir.startsWith(resolvedRoot) || currentDir === resolvedRoot) {
    const claudePath = join(currentDir, 'CLAUDE.md');
    if (existsSync(claudePath)) {
      collected.push(claudePath);
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // Reverse to get root-first order
  return collected.reverse();
}

/**
 * Try to find git root directory
 */
function getGitRoot(startPath: string): string | null {
  let currentDir = startPath;
  
  while (true) {
    const gitPath = join(currentDir, '.git');
    if (existsSync(gitPath)) {
      return currentDir;
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * Load and merge CLAUDE.md files from hierarchy
 * Child files override parent files for same sections
 */
export function loadCLAUDEHierarchy(startPath: string, rootPath?: string): CLAUDEContent[] {
  const files = findCLAUDEFiles(startPath, rootPath);
  return files.map(f => loadCLAUDEFile(f)).filter((c): c is CLAUDEContent => c !== null);
}

/**
 * Format CLAUDE content as system prompt addition
 */
export function formatAsSystemPrompt(contents: CLAUDEContent[]): string {
  if (contents.length === 0) {
    return '';
  }

  const parts: string[] = ['# Workspace Context (from CLAUDE.md)'];

  for (const content of contents) {
    const relativePath = content.path.replace(process.cwd(), '.');
    parts.push(`\n## Source: ${relativePath}`);
    
    if (content.metadata.title) {
      parts.push(`**Title**: ${content.metadata.title}`);
    }
    if (content.metadata.description) {
      parts.push(`**Description**: ${content.metadata.description}`);
    }
    
    // Add sections, skipping title if it matches file title
    for (const section of content.sections) {
      const prefix = '#'.repeat(section.level);
      parts.push(`\n${prefix} ${section.title}`);
      if (section.content) {
        parts.push(section.content);
      }
    }
  }

  return parts.join('\n');
}

/**
 * CLAUDE Loader Manager
 */
export class CLAUDELoader {
  private cache: Map<string, CLAUDEContent> = new Map();
  private rootPath: string;

  constructor(rootPath?: string) {
    this.rootPath = rootPath || process.cwd();
  }

  /**
   * Load CLAUDE.md for a specific path
   */
  loadForPath(filePath: string): CLAUDEContent[] {
    const resolvedPath = resolve(filePath);
    const cacheKey = resolvedPath;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached ? [cached] : [];
    }

    // Load hierarchy
    const contents = loadCLAUDEHierarchy(resolvedPath, this.rootPath);
    
    // Cache results
    for (const content of contents) {
      this.cache.set(content.path, content);
    }

    return contents;
  }

  /**
   * Get system prompt addition for a path
   */
  getSystemPrompt(filePath: string): string {
    const contents = this.loadForPath(filePath);
    return formatAsSystemPrompt(contents);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reload all CLAUDE files
   */
  reload(filePath: string): CLAUDEContent[] {
    this.clearCache();
    return this.loadForPath(filePath);
  }
}

// Export singleton
export const globalCLAUDELoader = new CLAUDELoader();
