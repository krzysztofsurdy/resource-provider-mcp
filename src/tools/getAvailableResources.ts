import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';
import { ResourceHierarchyBuilder } from '../services/ResourceHierarchyBuilder.js';
import { Resource } from '../core/interfaces/Resource.js';

export class GetAvailableResourcesTool {
  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { prefix?: string }): Promise<string> {
    const flatItems = args.prefix
      ? this.registry.getByPrefix(args.prefix)
      : this.registry.getAll();

    // Build hierarchical structure
    const hierarchyBuilder = new ResourceHierarchyBuilder();
    const items = hierarchyBuilder.build(flatItems);

    return JSON.stringify(
      items.map((r) => this.serializeResource(r)),
      null,
      2
    );
  }

  private serializeResource(r: Resource): any {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description ?? null,
      whenToLoad: r.whenToLoad ?? null,
      importance: r.importance ?? null,
      children: r.children.map((c) => this.serializeResource(c)),
    };
  }
}
