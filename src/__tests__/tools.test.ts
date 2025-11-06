import { describe, it, expect, beforeEach } from '@jest/globals';
import { GetAvailableResourcesTool } from '../tools/getAvailableResources';
import { FindResourceByPhrasesTool } from '../tools/findResourceByPhrases';
import { GetResourceContentTool } from '../tools/getResourceContent';
import { ResourceRegistry } from '../core/interfaces/ResourceRegistry';
import { Resource } from '../core/interfaces/Resource';

class MockResourceRegistry implements ResourceRegistry {
  private resources: Resource[] = [];

  setResources(resources: Resource[]) {
    this.resources = resources;
  }

  getAll(): Resource[] {
    return this.resources;
  }

  getByPrefix(prefix: string): Resource[] {
    return this.resources.filter((r) => r.id.toLowerCase().startsWith(prefix.toLowerCase()));
  }

  getById(id: string): Resource | undefined {
    return this.resources.find((r) => r.id === id);
  }

  searchByPhrases(phrases: string[]): Resource[] {
    return this.resources.filter((r) => {
      const searchText = [r.name, r.description, r.whenToLoad]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return phrases.some((phrase) => searchText.includes(phrase.toLowerCase()));
    });
  }

  async reload(): Promise<void> {
    // Mock implementation
  }
}

describe('GetAvailableResourcesTool', () => {
  let registry: MockResourceRegistry;
  let tool: GetAvailableResourcesTool;

  beforeEach(() => {
    registry = new MockResourceRegistry();
    tool = new GetAvailableResourcesTool(registry);
  });

  it('should return all resources with default pagination', async () => {
    const resources: Resource[] = [
      {
        id: 'a',
        name: 'A',
        type: 'file',
        description: 'Test A',
        whenToLoad: undefined,
        importance: 'high',
        children: [],
        content: null,
      },
      {
        id: 'b',
        name: 'B',
        type: 'file',
        description: 'Test B',
        whenToLoad: undefined,
        importance: 'low',
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(2);
    expect(parsed.limit).toBe(15);
    expect(parsed.page).toBe(1);
    expect(parsed.total).toBe(2);
    expect(parsed.totalPages).toBe(1);
  });

  it('should sort resources by importance then ID', async () => {
    const resources: Resource[] = [
      {
        id: 'z',
        name: 'Z',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: 'low',
        children: [],
        content: null,
      },
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
        importance: 'high',
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.resources[0].id).toBe('a');
    expect(parsed.resources[1].id).toBe('b');
    expect(parsed.resources[2].id).toBe('z');
  });

  it('should filter out sections without metadata', async () => {
    const resources: Resource[] = [
      {
        id: 'file',
        name: 'File',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'section-with-meta',
        name: 'Section With Meta',
        type: 'section',
        description: 'Has description',
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'section-without-meta',
        name: 'Section Without Meta',
        type: 'section',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(2);
    expect(parsed.resources.find((r: { id: string }) => r.id === 'file')).toBeDefined();
    expect(
      parsed.resources.find((r: { id: string }) => r.id === 'section-with-meta')
    ).toBeDefined();
    expect(
      parsed.resources.find((r: { id: string }) => r.id === 'section-without-meta')
    ).toBeUndefined();
  });

  it('should deduplicate resources by ID', async () => {
    const resources: Resource[] = [
      {
        id: 'duplicate',
        name: 'First',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'duplicate',
        name: 'Second',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(1);
    expect(parsed.resources[0].name).toBe('First'); // Keeps first occurrence
  });

  it('should filter by prefix when provided', async () => {
    const resources: Resource[] = [
      {
        id: 'context|file',
        name: 'File',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'other|file',
        name: 'Other File',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ prefix: 'context' });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(1);
    expect(parsed.resources[0].id).toBe('context|file');
  });

  it('should respect custom limit parameter', async () => {
    const resources: Resource[] = Array.from({ length: 20 }, (_, i) => ({
      id: `res-${i}`,
      name: `Resource ${i}`,
      type: 'file',
      description: undefined,
      whenToLoad: undefined,
      importance: undefined,
      children: [],
      content: null,
    }));

    registry.setResources(resources);

    const result = await tool.execute({ limit: 5 });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(5);
    expect(parsed.limit).toBe(5);
    expect(parsed.totalPages).toBe(4);
  });

  it('should respect custom page parameter', async () => {
    const resources: Resource[] = Array.from({ length: 10 }, (_, i) => ({
      id: `res-${i}`,
      name: `Resource ${i}`,
      type: 'file',
      description: undefined,
      whenToLoad: undefined,
      importance: undefined,
      children: [],
      content: null,
    }));

    registry.setResources(resources);

    const result = await tool.execute({ limit: 3, page: 2 });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(3);
    expect(parsed.page).toBe(2);
    expect(parsed.resources[0].id).toBe('res-3');
  });

  it('should serialize resources with null for undefined fields', async () => {
    const resources: Resource[] = [
      {
        id: 'test',
        name: 'Test',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.resources[0].description).toBeNull();
    expect(parsed.resources[0].whenToLoad).toBeNull();
    expect(parsed.resources[0].importance).toBeNull();
  });
});

describe('FindResourceByPhrasesTool', () => {
  let registry: MockResourceRegistry;
  let tool: FindResourceByPhrasesTool;

  beforeEach(() => {
    registry = new MockResourceRegistry();
    tool = new FindResourceByPhrasesTool(registry);
  });

  it('should find resources by phrases with default pagination', async () => {
    const resources: Resource[] = [
      {
        id: 'a',
        name: 'Authentication',
        type: 'file',
        description: 'User login system',
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'b',
        name: 'Database',
        type: 'file',
        description: 'Data storage',
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ phrases: ['login'] });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(1);
    expect(parsed.resources[0].id).toBe('a');
    expect(parsed.limit).toBe(15);
    expect(parsed.page).toBe(1);
  });

  it('should sort found resources by importance then ID', async () => {
    const resources: Resource[] = [
      {
        id: 'z',
        name: 'Test Z',
        type: 'file',
        description: 'Testing',
        whenToLoad: undefined,
        importance: 'low',
        children: [],
        content: null,
      },
      {
        id: 'a',
        name: 'Test A',
        type: 'file',
        description: 'Testing',
        whenToLoad: undefined,
        importance: 'high',
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ phrases: ['test'] });
    const parsed = JSON.parse(result);

    expect(parsed.resources[0].id).toBe('a');
    expect(parsed.resources[1].id).toBe('z');
  });

  it('should filter out sections without metadata', async () => {
    const resources: Resource[] = [
      {
        id: 'section-with-meta',
        name: 'Test Section',
        type: 'section',
        description: 'Has description',
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'section-without-meta',
        name: 'Test Section',
        type: 'section',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ phrases: ['test'] });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(1);
    expect(parsed.resources[0].id).toBe('section-with-meta');
  });

  it('should deduplicate results by ID', async () => {
    const resources: Resource[] = [
      {
        id: 'duplicate',
        name: 'First Test',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
      {
        id: 'duplicate',
        name: 'Second Test',
        type: 'file',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ phrases: ['test'] });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(1);
    expect(parsed.resources[0].name).toBe('First Test');
  });

  it('should respect custom limit and page parameters', async () => {
    const resources: Resource[] = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      name: `Test ${i}`,
      type: 'file',
      description: undefined,
      whenToLoad: undefined,
      importance: undefined,
      children: [],
      content: null,
    }));

    registry.setResources(resources);

    const result = await tool.execute({ phrases: ['test'], limit: 3, page: 2 });
    const parsed = JSON.parse(result);

    expect(parsed.resources).toHaveLength(3);
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(3);
  });
});

describe('GetResourceContentTool', () => {
  let registry: MockResourceRegistry;
  let tool: GetResourceContentTool;

  beforeEach(() => {
    registry = new MockResourceRegistry();
    tool = new GetResourceContentTool(registry);
  });

  it('should return resource content by ID', async () => {
    const resources: Resource[] = [
      {
        id: 'test',
        name: 'Test',
        type: 'file',
        description: 'Test description',
        whenToLoad: 'When testing',
        importance: 'high',
        children: [],
        content: 'This is the content',
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ id: 'test' });

    expect(result.text).toContain('# Test');
    expect(result.text).toContain('Test description');
    expect(result.text).toContain('When testing');
    expect(result.text).toContain('high');
    expect(result.text).toContain('This is the content');
    expect(result.isError).toBeUndefined();
  });

  it('should return error message when resource not found', async () => {
    registry.setResources([]);

    const result = await tool.execute({ id: 'nonexistent' });

    expect(result.text).toContain('not found');
    expect(result.isError).toBe(true);
  });

  it('should handle resource without content', async () => {
    const resources: Resource[] = [
      {
        id: 'test',
        name: 'Test',
        type: 'context',
        description: 'Context description',
        whenToLoad: undefined,
        importance: undefined,
        children: [],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ id: 'test' });

    expect(result.text).toContain('# Test');
    expect(result.text).toContain('Context description');
    expect(result.isError).toBeUndefined();
  });

  it('should include children when showChildren is true', async () => {
    const resources: Resource[] = [
      {
        id: 'parent',
        name: 'Parent',
        type: 'context',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [
          {
            id: 'child1',
            name: 'Child 1',
            type: 'file',
            description: 'First child',
            whenToLoad: undefined,
            importance: undefined,
            children: [],
            content: null,
          },
          {
            id: 'child2',
            name: 'Child 2',
            type: 'file',
            description: 'Second child',
            whenToLoad: undefined,
            importance: undefined,
            children: [],
            content: null,
          },
        ],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ id: 'parent', showChildren: true });

    expect(result.text).toContain('Children (2)');
    expect(result.text).toContain('Child 1');
    expect(result.text).toContain('Child 2');
    expect(result.text).toContain('First child');
    expect(result.text).toContain('Second child');
  });

  it('should not include children when showChildren is false', async () => {
    const resources: Resource[] = [
      {
        id: 'parent',
        name: 'Parent',
        type: 'context',
        description: undefined,
        whenToLoad: undefined,
        importance: undefined,
        children: [
          {
            id: 'child1',
            name: 'Child 1',
            type: 'file',
            description: undefined,
            whenToLoad: undefined,
            importance: undefined,
            children: [],
            content: null,
          },
        ],
        content: null,
      },
    ];

    registry.setResources(resources);

    const result = await tool.execute({ id: 'parent', showChildren: false });

    expect(result.text).not.toContain('Children');
    expect(result.text).not.toContain('Child 1');
  });
});
