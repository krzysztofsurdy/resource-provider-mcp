import fs from 'fs';
import path from 'path';
import { ResourceParser } from '../../core/interfaces/ResourceParser';
import { Resource } from '../../core/interfaces/Resource';
import { Importance } from '../../core/enum/Importance';

export class JsonResourceMetadataParser implements ResourceParser {
  private static readonly FILENAME = 'resource.json';
  private readonly MAX_DEPTH = 10;

  async parse(inputPath: string, depth = 0, parentPrefix = ''): Promise<Resource[]> {
    if (!fs.existsSync(inputPath)) return [];
    if (depth > this.MAX_DEPTH) return [];

    const results: Resource[] = [];

    const resourceJsonPath = path.join(inputPath, JsonResourceMetadataParser.FILENAME);
    const hasResourceJson = fs.existsSync(resourceJsonPath);

    let currentPrefix = parentPrefix;

    if (hasResourceJson) {
      try {
        const fileContent = fs.readFileSync(resourceJsonPath, 'utf8');
        const raw = JSON.parse(fileContent);
        const name = path.basename(inputPath);
        const contextId = this.slugify(name);
        const fullId = parentPrefix ? `${parentPrefix}|${contextId}` : contextId;
        currentPrefix = fullId;

        const resource: Resource = {
          id: fullId,
          name,
          type: 'context',
          description: raw.description,
          whenToLoad: raw.whenToLoad,
          importance: this.validateImportance(raw.importance),
          children: [],
          content: null,
        };
        results.push(resource);
      } catch {
        // Ignore parsing errors for invalid resource.json files
      }
    }

    if (hasResourceJson || depth === 0) {
      try {
        const entries = fs.readdirSync(inputPath);
        for (const entry of entries) {
          const fullPath = path.join(inputPath, entry);
          let stats;
          try {
            stats = fs.statSync(fullPath);
          } catch {
            continue;
          }

          if (stats.isDirectory()) {
            const childResources = await this.parse(fullPath, depth + 1, currentPrefix);
            results.push(...childResources);
          }
        }
      } catch {
        // Ignore directory read errors
      }
    }

    return results;
  }

  private validateImportance(value: unknown): Importance | undefined {
    if (value === 'low' || value === 'mid' || value === 'high') {
      return value;
    }
    return undefined;
  }

  private slugify(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
