import { Resource } from './Resource';

export interface ResourceFilter {
  uniqueBy<K extends keyof Resource>(resources: Resource[], field: K): Resource[];
  filterBy(resources: Resource[], predicate: (resource: Resource) => boolean): Resource[];
}
