import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';
import { ResourceSorter } from '../services/ResourceSorter.js';

export class FindResourceByPhrasesTool {
  private readonly sorter = new ResourceSorter();

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

    // Sort by importance (high -> mid -> low -> null), then by ID
    const sortedResults = this.sorter.sort(filteredResults);

    return JSON.stringify(
      sortedResults.map((r) => ({
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
