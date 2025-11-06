import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';
import { Resource } from '../core/interfaces/Resource.js';

interface SerializedResource {
  id: string;
  name: string;
  type: string;
  description: string | null;
  whenToLoad: string | null;
  importance: string | null;
}

export class GetAvailableResourcesTool {
  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { prefix?: string }): Promise<string> {
    const flatItems = args.prefix ? this.registry.getByPrefix(args.prefix) : this.registry.getAll();

    // Deduplicate by ID (keep first occurrence)
    const seenIds = new Set<string>();
    const uniqueItems = flatItems.filter((r) => {
      if (seenIds.has(r.id)) {
        return false;
      }
      seenIds.add(r.id);
      return true;
    });

    // Filter out sections without metadata
    const filteredItems = uniqueItems.filter((r) => {
      if (r.type === 'section') {
        // Only include sections that have at least one metadata field
        return r.description || r.whenToLoad || r.importance;
      }
      return true; // Include all contexts and files
    });

    return JSON.stringify(
      filteredItems.map((r) => this.serializeResource(r)),
      null,
      2
    );
  }

  private serializeResource(r: Resource): SerializedResource {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description ?? null,
      whenToLoad: r.whenToLoad ?? null,
      importance: r.importance ?? null,
    };
  }
}
