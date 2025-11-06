import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';

export class FindResourceByPhrasesTool {
  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { phrases: string[] }): Promise<string> {
    const results = this.registry.searchByPhrases(args.phrases);

    // Deduplicate by ID (keep first occurrence)
    const seenIds = new Set<string>();
    const uniqueResults = results.filter((r) => {
      if (seenIds.has(r.id)) {
        return false;
      }
      seenIds.add(r.id);
      return true;
    });

    return JSON.stringify(
      uniqueResults.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        description: r.description ?? null,
        whenToLoad: r.whenToLoad ?? null,
        importance: r.importance ?? null,
      })),
      null,
      2
    );
  }
}
