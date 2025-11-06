import { describe, it, expect } from '@jest/globals';
import { SimpleResourceFilter } from '../services/SimpleResourceFilter';
import { Resource } from '../core/interfaces/Resource';

describe('SimpleResourceFilter', () => {
  const filter = new SimpleResourceFilter();

  describe('uniqueBy', () => {
    it('should remove duplicates by id field', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'First A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'a',
          name: 'Second A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.uniqueBy(resources, 'id');

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('a');
      expect(result[0].name).toBe('First A'); // Keeps first occurrence
      expect(result[1].id).toBe('b');
    });

    it('should remove duplicates by name field', () => {
      const resources: Resource[] = [
        {
          id: '1',
          name: 'duplicate',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: '2',
          name: 'unique',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: '3',
          name: 'duplicate',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.uniqueBy(resources, 'name');

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('duplicate');
      expect(result[0].id).toBe('1'); // Keeps first occurrence
      expect(result[1].name).toBe('unique');
    });

    it('should remove duplicates by type field', () => {
      const resources: Resource[] = [
        {
          id: '1',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: '2',
          name: 'B',
          type: 'context',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: '3',
          name: 'C',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.uniqueBy(resources, 'type');

      expect(result.length).toBe(2);
      expect(result[0].type).toBe('file');
      expect(result[1].type).toBe('context');
    });

    it('should handle empty array', () => {
      const resources: Resource[] = [];
      const result = filter.uniqueBy(resources, 'id');

      expect(result).toEqual([]);
    });

    it('should handle array with all unique items', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.uniqueBy(resources, 'id');

      expect(result.length).toBe(2);
      expect(result).toEqual(resources);
    });

    it('should handle array with all duplicate items', () => {
      const resources: Resource[] = [
        {
          id: 'same',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'same',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'same',
          name: 'C',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.uniqueBy(resources, 'id');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('A'); // Keeps first occurrence
    });

    it('should not mutate original array', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'a',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const originalLength = resources.length;
      filter.uniqueBy(resources, 'id');

      expect(resources.length).toBe(originalLength);
    });
  });

  describe('filterBy', () => {
    it('should filter resources using custom predicate', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'file',
          description: 'test',
          whenToLoad: undefined,
          importance: 'high',
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'c',
          name: 'C',
          type: 'file',
          description: 'another',
          whenToLoad: undefined,
          importance: 'low',
          children: [],
          content: null,
        },
      ];

      const result = filter.filterBy(resources, (r) => r.importance === 'high');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('a');
    });

    it('should filter by type', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'context',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'c',
          name: 'C',
          type: 'section',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.filterBy(resources, (r) => r.type === 'file' || r.type === 'section');

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('b');
      expect(result[1].id).toBe('c');
    });

    it('should filter sections with metadata', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'section',
          description: 'has description',
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'section',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'c',
          name: 'C',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.filterBy(resources, (r) => {
        if (r.type === 'section') {
          return !!(r.description || r.whenToLoad || r.importance);
        }
        return true;
      });

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('c');
    });

    it('should handle empty array', () => {
      const resources: Resource[] = [];
      const result = filter.filterBy(resources, (r) => r.importance === 'high');

      expect(result).toEqual([]);
    });

    it('should return empty array when no items match predicate', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: 'low',
          children: [],
          content: null,
        },
      ];

      const result = filter.filterBy(resources, (r) => r.importance === 'high');

      expect(result).toEqual([]);
    });

    it('should return all items when all match predicate', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: undefined,
          children: [],
          content: null,
        },
      ];

      const result = filter.filterBy(resources, (r) => r.type === 'file');

      expect(result.length).toBe(2);
      expect(result).toEqual(resources);
    });

    it('should not mutate original array', () => {
      const resources: Resource[] = [
        {
          id: 'a',
          name: 'A',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: 'high',
          children: [],
          content: null,
        },
        {
          id: 'b',
          name: 'B',
          type: 'file',
          description: undefined,
          whenToLoad: undefined,
          importance: 'low',
          children: [],
          content: null,
        },
      ];

      const originalLength = resources.length;
      filter.filterBy(resources, (r) => r.importance === 'high');

      expect(resources.length).toBe(originalLength);
    });
  });
});
