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

    // Filter out sections without metadata
    const filteredResults = uniqueResults.filter((r) => {
      if (r.type === 'section') {
        // Only include sections that have at least one metadata field
        return r.description || r.whenToLoad || r.importance;
      }
      return true; // Include all contexts and files
    });

    return JSON.stringify(
      filteredResults.map((r) => ({
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
