import { Resource } from '../core/interfaces/Resource';

export class ResourceSorter {
  /**
   * Sort resources by importance (high -> mid -> low -> null), then by ID
   */
  sort(resources: Resource[]): Resource[] {
    return [...resources].sort((a, b) => {
      // Importance order: high = 0, mid = 1, low = 2, null = 3
      const importanceOrder: Record<string, number> = { high: 0, mid: 1, low: 2 };
      const aImportance = a.importance ? importanceOrder[a.importance] : 3;
      const bImportance = b.importance ? importanceOrder[b.importance] : 3;

      if (aImportance !== bImportance) {
        return aImportance - bImportance;
      }

      // If importance is the same, sort by ID
      return a.id.localeCompare(b.id);
    });
  }
}
