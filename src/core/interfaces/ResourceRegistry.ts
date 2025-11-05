import { Resource } from './Resource';

export interface ResourceRegistry {
    reload(): Promise<void>;
    getAll(): Resource[];
    getByPrefix(prefix: string): Resource[]; // "tests|testing"
    getById(id: string): Resource | undefined;
    searchByPhrases(phrases: string[]): Resource[]; // case-insensitive, whole-word match
}