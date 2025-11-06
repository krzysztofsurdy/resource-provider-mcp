import fs from 'fs';
import path from 'path';
import { ResourceParser } from '../../core/interfaces/ResourceParser';
import { Resource } from '../../core/interfaces/Resource';
import { Importance } from '../../core/enum/Importance';

export class MarkdownSectionParser implements ResourceParser {
  private readonly HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/gm;
  private readonly BLOCK_RE = /<!--\s*([\s\S]*?)\s*-->/;
  private readonly KV_RE = /^\s*([a-zA-Z][\w-]*?)\s*:\s*(.+?)\s*$/gm;
  private readonly MAX_DEPTH = 10;

  async parse(inputPath: string, depth = 0, contextPrefix = ''): Promise<Resource[]> {
    if (!fs.existsSync(inputPath)) return [];
    if (depth > this.MAX_DEPTH) return [];

    let stats;
    try {
      stats = fs.statSync(inputPath);
    } catch (error) {
      console.error(`Failed to stat ${inputPath}:`, error);
      return [];
    }

    if (stats.isDirectory()) {
      const results: Resource[] = [];

      const resourceJsonPath = path.join(inputPath, 'resource.json');
      let newContextPrefix = contextPrefix;
      if (fs.existsSync(resourceJsonPath)) {
        const dirName = path.basename(inputPath);
        const contextId = this.slugify(dirName);
        newContextPrefix = contextPrefix ? `${contextPrefix}|${contextId}` : contextId;
      }

      try {
        const entries = fs.readdirSync(inputPath);
        for (const entry of entries) {
          const fullPath = path.join(inputPath, entry);
          const parsed = await this.parse(fullPath, depth + 1, newContextPrefix);
          results.push(...parsed);
        }
      } catch (error) {
        console.error(`Failed to read directory ${inputPath}:`, error);
      }
      return results;
    }

    if (!inputPath.endsWith('.md')) return [];

    let text: string;
    try {
      text = fs.readFileSync(inputPath, 'utf8');
    } catch (error) {
      console.error(`Failed to read file ${inputPath}:`, error);
      return [];
    }
    const fileName = path.basename(inputPath, '.md');
    const fileId = this.slugify(fileName);
    const fileFullId = contextPrefix ? `${contextPrefix}|${fileId}` : fileId;
    const sections: Resource[] = [];

    const matches = [...text.matchAll(this.HEADING_RE)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[2].trim();
      const start = match.index ?? 0;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      const body = text.slice(start, end).trim();
      const sectionId = this.slugify(title);

      // Parse section metadata from comment right after heading
      const metadata = this.parseSectionMetadata(body);

      sections.push({
        id: `${fileFullId}|${sectionId}`,
        name: title,
        type: 'section',
        description: metadata.description,
        whenToLoad: metadata.whenToLoad,
        importance: metadata.importance,
        children: [],
        content: body,
      });
    }

    return sections;
  }

  private parseSectionMetadata(sectionBody: string): Partial<Resource> {
    const meta: Partial<Resource> = {};

    // Look for HTML comment right after the heading
    // The body includes the heading, so we need to skip it
    const lines = sectionBody.split('\n');
    if (lines.length < 2) return meta;

    // Try to find comment block starting from line 1 (after heading)
    const afterHeading = lines.slice(1).join('\n');
    const commentMatch = afterHeading.match(this.BLOCK_RE);

    if (!commentMatch) return meta;

    const block = commentMatch[1];
    for (const line of block.split('\n')) {
      const kv = this.KV_RE.exec(line);
      this.KV_RE.lastIndex = 0;
      if (!kv) continue;
      const key = kv[1].trim().toLowerCase();
      const val = kv[2].trim();
      if (key === 'description') {
        meta.description = val;
      } else if (key === 'whentoload' || key === 'whenload') {
        meta.whenToLoad = val;
      } else if (key === 'importance' || key === 'priority') {
        const normalizedVal = val.toLowerCase();
        if (this.isValidImportance(normalizedVal)) {
          meta.importance = normalizedVal;
        }
      }
    }
    return meta;
  }

  private isValidImportance(value: string): value is Importance {
    return value === 'low' || value === 'mid' || value === 'high';
  }

  private slugify(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
