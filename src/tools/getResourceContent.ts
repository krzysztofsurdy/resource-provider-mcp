import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';

export class GetResourceContentTool {
  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { id: string; showChildren?: boolean }): Promise<{ text: string; isError?: boolean }> {
    const resource = this.registry.getById(args.id);

    if (!resource) {
      return {
        text: `Resource '${args.id}' not found.`,
        isError: true,
      };
    }

    let output = `# ${resource.name}\n\n`;
    if (resource.description) output += `**Description:** ${resource.description}\n\n`;
    if (resource.whenToLoad) output += `**When to load:** ${resource.whenToLoad}\n\n`;
    if (resource.importance) output += `**Importance:** ${resource.importance}\n\n`;
    if (resource.content) output += `\n---\n\n${resource.content}\n`;

    if (args.showChildren && resource.children.length > 0) {
      output += `\n## Children (${resource.children.length})\n\n`;
      for (const child of resource.children) {
        output += `### ${child.name} (${child.id})\n`;
        if (child.description) output += `${child.description}\n`;
        output += `\n`;
      }
    }

    return { text: output };
  }
}
