import { ResourceLoader } from '../core/interfaces/ResourceLoader';
import { ResourceParser } from '../core/interfaces/ResourceParser';
import { Resource } from '../core/interfaces/Resource';

export class FilesystemResourceLoader implements ResourceLoader {
  constructor(private readonly parsers: ResourceParser[]) {}

  async loadAll(baseDir: string): Promise<Resource[]> {
    const results: Resource[] = [];
    for (const parser of this.parsers) {
      const parsed = await parser.parse(baseDir);
      results.push(...parsed);
    }
    return results;
  }
}
