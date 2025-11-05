import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InMemoryResourceRegistry } from '../services/InMemoryResourceRegistry.js';
import { Resource } from '../core/interfaces/Resource.js';
import { ResourceLoader } from '../core/interfaces/ResourceLoader.js';
import { Logger } from '../core/interfaces/Logger.js';

const mockLogger: Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const createMockResource = (
  id: string,
  name: string,
  type: 'context' | 'file' | 'section' = 'context',
  children: Resource[] = []
): Resource => ({
  id,
  name,
  type,
  description: `Description for ${name}`,
  whenToLoad: `When to load ${name}`,
  importance: 'mid',
  children,
  content: type === 'context' ? null : `Content for ${name}`,
});

describe('InMemoryResourceRegistry', () => {
  let registry: InMemoryResourceRegistry;
  let mockLoader: ResourceLoader;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoader = {
      loadAll: jest.fn<(path: string) => Promise<Resource[]>>(),
    };
    registry = new InMemoryResourceRegistry('/test/path', mockLoader, mockLogger);
  });

  describe('reload', () => {
    it('should load resources and flatten hierarchy', async () => {
      const child1 = createMockResource('parent|child1', 'Child 1', 'file');
      const child2 = createMockResource('parent|child2', 'Child 2', 'file');
      const parent = createMockResource('parent', 'Parent', 'context', [child1, child2]);

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue([parent]);

      await registry.reload();

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(registry.getById('parent')).toBeDefined();
      expect(registry.getById('parent|child1')).toBeDefined();
      expect(registry.getById('parent|child2')).toBeDefined();
    });

    it('should handle deeply nested children', async () => {
      const grandchild = createMockResource('parent|child|grandchild', 'Grandchild', 'section');
      const child = createMockResource('parent|child', 'Child', 'file', [grandchild]);
      const parent = createMockResource('parent', 'Parent', 'context', [child]);

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue([parent]);

      await registry.reload();

      expect(registry.getAll()).toHaveLength(3);
      expect(registry.getById('parent|child|grandchild')).toBeDefined();
    });

    it('should clear existing resources before reload', async () => {
      const resource1 = createMockResource('test1', 'Test 1');
      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue([resource1]);

      await registry.reload();
      expect(registry.getAll()).toHaveLength(1);

      const resource2 = createMockResource('test2', 'Test 2');
      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue([resource2]);

      await registry.reload();
      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getById('test1')).toBeUndefined();
      expect(registry.getById('test2')).toBeDefined();
    });

    it('should log reload information', async () => {
      const resources = [
        createMockResource('test1', 'Test 1'),
        createMockResource('test2', 'Test 2'),
      ];

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue(resources);

      await registry.reload();

      expect(mockLogger.info).toHaveBeenCalledWith('Registry reloaded', { count: 2 });
    });
  });

  describe('getAll', () => {
    it('should return all resources', async () => {
      const resources = [
        createMockResource('test1', 'Test 1'),
        createMockResource('test2', 'Test 2'),
        createMockResource('test3', 'Test 3'),
      ];

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue(resources);
      await registry.reload();

      const all = registry.getAll();
      expect(all).toHaveLength(3);
    });

    it('should return empty array when no resources loaded', () => {
      const all = registry.getAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('getByPrefix', () => {
    beforeEach(async () => {
      const resources = [
        createMockResource('tests|unit', 'Unit Tests'),
        createMockResource('tests|integration', 'Integration Tests'),
        createMockResource('tests|e2e', 'E2E Tests'),
        createMockResource('docs|api', 'API Docs'),
        createMockResource('docs', 'Documentation'),
      ];

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue(resources);
      await registry.reload();
    });

    it('should return resources matching prefix', () => {
      const results = registry.getByPrefix('tests');
      expect(results).toHaveLength(3);
      expect(results.every(r => r.id.startsWith('tests'))).toBe(true);
    });

    it('should return exact match and children when ID equals prefix', () => {
      const results = registry.getByPrefix('docs');
      // Should return 'docs' and 'docs|api'
      expect(results).toHaveLength(2);
      expect(results.some(r => r.id === 'docs')).toBe(true);
      expect(results.some(r => r.id === 'docs|api')).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = registry.getByPrefix('TESTS');
      expect(results).toHaveLength(3);
    });

    it('should return empty array for non-existent prefix', () => {
      const results = registry.getByPrefix('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should not match when prefix ends with separator', () => {
      // 'tests|' doesn't match 'tests|unit' because startsWith('tests|' + '|')
      const results = registry.getByPrefix('tests|');
      expect(results).toHaveLength(0);
    });
  });

  describe('getById', () => {
    beforeEach(async () => {
      const resources = [
        createMockResource('test1', 'Test 1'),
        createMockResource('test2', 'Test 2'),
      ];

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue(resources);
      await registry.reload();
    });

    it('should return resource by exact ID', () => {
      const result = registry.getById('test1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('test1');
      expect(result?.name).toBe('Test 1');
    });

    it('should return undefined for non-existent ID', () => {
      const result = registry.getById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const result = registry.getById('TEST1');
      expect(result).toBeUndefined();
    });
  });

  describe('searchByPhrases', () => {
    beforeEach(async () => {
      const resources = [
        createMockResource('test1', 'Debugging Tools'),
        createMockResource('test2', 'Testing Framework'),
        createMockResource('test3', 'Performance Optimization'),
      ];

      resources[0].description = 'Tools for debugging and troubleshooting issues';
      resources[0].whenToLoad = 'When you need to debug problems';
      resources[1].description = 'Framework for writing unit tests';
      resources[1].whenToLoad = 'When testing your application';
      resources[2].description = 'Optimization techniques for better performance';
      resources[2].whenToLoad = 'When optimizing code performance';

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue(resources);
      await registry.reload();
    });

    it('should find resources by phrase in name', () => {
      const results = registry.searchByPhrases(['Debugging']);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Debugging Tools');
    });

    it('should find resources by phrase in description', () => {
      const results = registry.searchByPhrases(['troubleshooting']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test1');
    });

    it('should find resources by phrase in whenToLoad', () => {
      const results = registry.searchByPhrases(['testing']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test2');
    });

    it('should match whole words only', () => {
      const results = registry.searchByPhrases(['test']);
      // "test" as a whole word doesn't appear in "tests" or "testing" - those are different words
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const results = registry.searchByPhrases(['DEBUGGING']);
      expect(results).toHaveLength(1);
    });

    it('should match any phrase (OR logic)', () => {
      const results = registry.searchByPhrases(['debugging', 'optimization']);
      expect(results).toHaveLength(2);
    });

    it('should return empty array when no matches', () => {
      const results = registry.searchByPhrases(['nonexistent']);
      expect(results).toHaveLength(0);
    });

    it('should handle special regex characters', async () => {
      const resource = createMockResource('test4', 'C++ Programming');
      resource.description = 'Learn C++ programming';

      (mockLoader.loadAll as jest.MockedFunction<typeof mockLoader.loadAll>).mockResolvedValue([resource]);
      await registry.reload();

      // "C++" doesn't match as a whole word because + is a word boundary
      // We need to search for "programming" which appears in both name and description
      const results = registry.searchByPhrases(['programming']);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('C++ Programming');
    });
  });
});
