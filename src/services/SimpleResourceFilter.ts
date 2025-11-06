import { Resource } from '../core/interfaces/Resource';
import { ResourceFilter } from '../core/interfaces/ResourceFilter';

export class SimpleResourceFilter implements ResourceFilter {
  uniqueBy<K extends keyof Resource>(resources: Resource[], field: K): Resource[] {
    const seen = new Set<Resource[K]>();
    return resources.filter((resource) => {
      const value = resource[field];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  filterBy(resources: Resource[], predicate: (resource: Resource) => boolean): Resource[] {
    return resources.filter(predicate);
  }
}
