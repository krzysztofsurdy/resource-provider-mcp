import { Resource } from '../core/interfaces/Resource';
import { ResourceSorter } from '../core/interfaces/ResourceSorter';

export class ImportanceResourceSorter implements ResourceSorter {
  sort(resources: Resource[]): Resource[] {
    return [...resources].sort((a, b) => {
      const importanceOrder: Record<string, number> = { high: 0, mid: 1, low: 2 };
      const aImportance = a.importance ? importanceOrder[a.importance] : 3;
      const bImportance = b.importance ? importanceOrder[b.importance] : 3;

      if (aImportance !== bImportance) {
        return aImportance - bImportance;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
