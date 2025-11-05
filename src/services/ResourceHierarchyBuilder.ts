import { Resource } from '../core/interfaces/Resource.js';

export class ResourceHierarchyBuilder {
  build(flatResources: Resource[]): Resource[] {
    const resourceMap = new Map<string, Resource>();
    const roots: Resource[] = [];

    for (const resource of flatResources) {
      const clone: Resource = {
        ...resource,
        children: [],
      };
      resourceMap.set(resource.id, clone);
    }

    for (const resource of resourceMap.values()) {
      const parentId = this.getParentId(resource.id);

      if (parentId) {
        const parent = resourceMap.get(parentId);
        if (parent) {
          parent.children.push(resource);
        } else {
          roots.push(resource);
        }
      } else {
        roots.push(resource);
      }
    }

    return roots;
  }

  private getParentId(id: string): string | null {
    const lastPipeIndex = id.lastIndexOf('|');
    if (lastPipeIndex === -1) {
      return null;
    }
    return id.substring(0, lastPipeIndex);
  }
}
