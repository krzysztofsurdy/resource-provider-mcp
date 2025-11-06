import { describe, it, expect } from '@jest/globals';
import { ResourceSorter } from '../services/ResourceSorter';
import { Resource } from '../core/interfaces/Resource';

describe('ResourceSorter', () => {
  const sorter = new ResourceSorter();

  it('should sort by importance: high, mid, low, null', () => {
    const resources: Resource[] = [
      {
        id: 'a',
        name: 'A',
        type: 'file',
        importance: 'low',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'b',
        name: 'B',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'c',
        name: 'C',
        type: 'file',
        importance: undefined,
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'd',
        name: 'D',
        type: 'file',
        importance: 'mid',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
    ];

    const sorted = sorter.sort(resources);

    expect(sorted[0].id).toBe('b'); // high
    expect(sorted[1].id).toBe('d'); // mid
    expect(sorted[2].id).toBe('a'); // low
    expect(sorted[3].id).toBe('c'); // null
  });

  it('should sort by ID when importance is the same', () => {
    const resources: Resource[] = [
      {
        id: 'z|file',
        name: 'Z',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'a|file',
        name: 'A',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'm|file',
        name: 'M',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
    ];

    const sorted = sorter.sort(resources);

    expect(sorted[0].id).toBe('a|file');
    expect(sorted[1].id).toBe('m|file');
    expect(sorted[2].id).toBe('z|file');
  });

  it('should handle mixed importance and ID sorting', () => {
    const resources: Resource[] = [
      {
        id: 'z',
        name: 'Z',
        type: 'file',
        importance: 'low',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'a',
        name: 'A',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'b',
        name: 'B',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'c',
        name: 'C',
        type: 'file',
        importance: 'mid',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'd',
        name: 'D',
        type: 'file',
        importance: 'mid',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
    ];

    const sorted = sorter.sort(resources);

    // High importance first (sorted by ID)
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
    // Mid importance second (sorted by ID)
    expect(sorted[2].id).toBe('c');
    expect(sorted[3].id).toBe('d');
    // Low importance last
    expect(sorted[4].id).toBe('z');
  });

  it('should not mutate the original array', () => {
    const resources: Resource[] = [
      {
        id: 'b',
        name: 'B',
        type: 'file',
        importance: 'low',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
      {
        id: 'a',
        name: 'A',
        type: 'file',
        importance: 'high',
        description: undefined,
        whenToLoad: undefined,
        children: [],
        content: null,
      },
    ];

    const sorted = sorter.sort(resources);

    // Original array should not be modified
    expect(resources[0].id).toBe('b');
    expect(resources[1].id).toBe('a');

    // Sorted array should be different
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });

  it('should handle empty array', () => {
    const resources: Resource[] = [];
    const sorted = sorter.sort(resources);
    expect(sorted).toEqual([]);
  });
});
