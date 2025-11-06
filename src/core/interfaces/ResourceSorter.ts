import { Resource } from './Resource';

export interface ResourceSorter {
  sort(resources: Resource[]): Resource[];
}
