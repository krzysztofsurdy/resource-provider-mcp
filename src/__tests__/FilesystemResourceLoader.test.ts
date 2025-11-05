import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FilesystemResourceLoader } from '../services/FilesystemResourceLoader.js';
import { ResourceParser } from '../core/interfaces/ResourceParser.js';
import { Resource } from '../core/interfaces/Resource.js';

const createMockResource = (
  id: string,
  name: string,
  type: 'context' | 'file' | 'section' = 'context'
): Resource => ({
  id,
  name,
  type,
  description: `Description for ${name}`,
  whenToLoad: `When to load ${name}`,
  importance: 'mid',
  children: [],
  content: type === 'context' ? null : `Content for ${name}`,
});

describe('FilesystemResourceLoader', () => {
  let loader: FilesystemResourceLoader;
  let mockParser1: ResourceParser;
  let mockParser2: ResourceParser;
  let mockParser3: ResourceParser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParser1 = {
      parse: jest.fn<(path: string) => Promise<Resource[]>>(),
    };

    mockParser2 = {
      parse: jest.fn<(path: string) => Promise<Resource[]>>(),
    };

    mockParser3 = {
      parse: jest.fn<(path: string) => Promise<Resource[]>>(),
    };
  });

  describe('loadAll', () => {
    it('should call all parsers with the base directory', async () => {
      loader = new FilesystemResourceLoader([mockParser1, mockParser2]);

      (mockParser1.parse as jest.MockedFunction<typeof mockParser1.parse>).mockResolvedValue([]);
      (mockParser2.parse as jest.MockedFunction<typeof mockParser2.parse>).mockResolvedValue([]);

      await loader.loadAll('/test/path');

      expect(mockParser1.parse).toHaveBeenCalledWith('/test/path');
      expect(mockParser2.parse).toHaveBeenCalledWith('/test/path');
    });

    it('should aggregate results from all parsers', async () => {
      const resource1 = createMockResource('res1', 'Resource 1', 'context');
      const resource2 = createMockResource('res2', 'Resource 2', 'file');
      const resource3 = createMockResource('res3', 'Resource 3', 'section');

      loader = new FilesystemResourceLoader([mockParser1, mockParser2, mockParser3]);

      (mockParser1.parse as jest.MockedFunction<typeof mockParser1.parse>).mockResolvedValue([resource1]);
      (mockParser2.parse as jest.MockedFunction<typeof mockParser2.parse>).mockResolvedValue([resource2]);
      (mockParser3.parse as jest.MockedFunction<typeof mockParser3.parse>).mockResolvedValue([resource3]);

      const results = await loader.loadAll('/test/path');

      expect(results).toHaveLength(3);
      expect(results).toContainEqual(resource1);
      expect(results).toContainEqual(resource2);
      expect(results).toContainEqual(resource3);
    });

    it('should handle parsers that return empty arrays', async () => {
      const resource1 = createMockResource('res1', 'Resource 1');

      loader = new FilesystemResourceLoader([mockParser1, mockParser2]);

      (mockParser1.parse as jest.MockedFunction<typeof mockParser1.parse>).mockResolvedValue([resource1]);
      (mockParser2.parse as jest.MockedFunction<typeof mockParser2.parse>).mockResolvedValue([]);

      const results = await loader.loadAll('/test/path');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(resource1);
    });

    it('should handle multiple resources from a single parser', async () => {
      const resource1 = createMockResource('res1', 'Resource 1');
      const resource2 = createMockResource('res2', 'Resource 2');
      const resource3 = createMockResource('res3', 'Resource 3');

      loader = new FilesystemResourceLoader([mockParser1]);

      (mockParser1.parse as jest.MockedFunction<typeof mockParser1.parse>).mockResolvedValue([
        resource1,
        resource2,
        resource3,
      ]);

      const results = await loader.loadAll('/test/path');

      expect(results).toHaveLength(3);
    });

    it('should work with no parsers', async () => {
      loader = new FilesystemResourceLoader([]);

      const results = await loader.loadAll('/test/path');

      expect(results).toHaveLength(0);
    });

    it('should preserve order of parser execution', async () => {
      const resource1 = createMockResource('res1', 'Resource 1');
      const resource2 = createMockResource('res2', 'Resource 2');
      const resource3 = createMockResource('res3', 'Resource 3');

      loader = new FilesystemResourceLoader([mockParser1, mockParser2, mockParser3]);

      (mockParser1.parse as jest.MockedFunction<typeof mockParser1.parse>).mockResolvedValue([resource1]);
      (mockParser2.parse as jest.MockedFunction<typeof mockParser2.parse>).mockResolvedValue([resource2]);
      (mockParser3.parse as jest.MockedFunction<typeof mockParser3.parse>).mockResolvedValue([resource3]);

      const results = await loader.loadAll('/test/path');

      expect(results[0]).toEqual(resource1);
      expect(results[1]).toEqual(resource2);
      expect(results[2]).toEqual(resource3);
    });

    it('should handle parser errors by propagating them', async () => {
      loader = new FilesystemResourceLoader([mockParser1]);

      const error = new Error('Parser failed');
      (mockParser1.parse as jest.MockedFunction<typeof mockParser1.parse>).mockRejectedValue(error);

      await expect(loader.loadAll('/test/path')).rejects.toThrow('Parser failed');
    });
  });
});
