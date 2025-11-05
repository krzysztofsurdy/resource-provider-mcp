import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';

export class FindResourceByPhrasesTool {
  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { phrases: string[] }): Promise<string> {
    const results = this.registry.searchByPhrases(args.phrases);

    return JSON.stringify(
      results.map((r) => ({
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
