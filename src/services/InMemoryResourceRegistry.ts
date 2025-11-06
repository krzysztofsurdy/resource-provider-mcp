import path from 'path';
import { Resource } from '../core/interfaces/Resource';
import { ResourceRegistry } from '../core/interfaces/ResourceRegistry';
import { ResourceLoader } from '../core/interfaces/ResourceLoader';
import { Logger } from '../core/interfaces/Logger';

export class InMemoryResourceRegistry implements ResourceRegistry {
  private readonly map = new Map<string, Resource>();
  private readonly baseDir: string;
  private readonly loader: ResourceLoader;
  private readonly logger: Logger;

  constructor(baseDir: string, loader: ResourceLoader, logger: Logger) {
    if (!baseDir) {
      throw new Error('baseDir is required');
    }
    this.baseDir = path.resolve(baseDir);
    this.loader = loader;
    this.logger = logger;
  }

  async reload(): Promise<void> {
    this.map.clear();
    const list = await this.loader.loadAll(this.baseDir);
    const stack: Resource[] = [...list];

    while (stack.length) {
      const r = stack.pop()!;
      if (this.map.has(r.id)) {
        this.logger.warn('Duplicate resource ID detected, last one wins', { id: r.id });
      }
      this.map.set(r.id, r);
      for (const c of r.children) stack.push(c);
    }

    this.logger.info('Registry reloaded', { count: this.map.size });
  }

  getAll(): Resource[] {
    return Array.from(this.map.values());
  }

  getByPrefix(prefix: string): Resource[] {
    if (!prefix) {
      return [];
    }
    const normalizedPrefix = prefix.toLowerCase();
    return Array.from(this.map.values()).filter((r) => {
      const normalizedId = r.id.toLowerCase();
      return normalizedId.startsWith(normalizedPrefix + '|') || normalizedId === normalizedPrefix;
    });
  }

  getById(id: string): Resource | undefined {
    if (!id) {
      return undefined;
    }
    return this.map.get(id);
  }

  searchByPhrases(phrases: string[]): Resource[] {
    if (!phrases || phrases.length === 0) {
      return [];
    }

    const results: Resource[] = [];
    const regexPatterns = phrases.map((phrase) => {
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escapedPhrase}\\b`, 'i');
    });

    for (const resource of this.map.values()) {
      const searchableText = [
        resource.name,
        resource.description ?? '',
        resource.whenToLoad ?? '',
      ].join('\n');

      if (regexPatterns.some((regex) => regex.test(searchableText))) {
        results.push(resource);
      }
    }
    return results;
  }
}
