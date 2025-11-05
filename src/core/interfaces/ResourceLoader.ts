import { Resource } from './Resource';

export interface ResourceLoader {
  loadAll(path: string): Promise<Resource[]>;
}
