import { describe, it, expect } from '@jest/globals';
import { FilesystemResourceLoader } from '../services/FilesystemResourceLoader.js';
import { InMemoryResourceRegistry } from '../services/InMemoryResourceRegistry.js';
import { JsonResourceMetadataParser } from '../services/parsers/JsonResourceMetadataParser.js';
import { MarkdownCommentMetadataParser } from '../services/parsers/MarkdownCommentMetadataParser.js';
import { MarkdownSectionParser } from '../services/parsers/MarkdownSectionParser.js';
import { Logger } from '../core/interfaces/Logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe('Integration Tests with Example Resources', () => {
  const examplesDir = path.join(__dirname, '../../resources/examples');

  let registry: InMemoryResourceRegistry;

  it('should load all example resources', async () => {
    const loader = new FilesystemResourceLoader([
      new JsonResourceMetadataParser(),
      new MarkdownCommentMetadataParser(),
      new MarkdownSectionParser(),
    ]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    const all = registry.getAll();

    // Should have loaded resources from the examples directory
    expect(all.length).toBeGreaterThan(0);
  });

  it('should find the context-level resource from resource.json', async () => {
    const loader = new FilesystemResourceLoader([
      new JsonResourceMetadataParser(),
      new MarkdownCommentMetadataParser(),
      new MarkdownSectionParser(),
    ]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    const resource = registry.getById('examples');

    expect(resource).toBeDefined();
    expect(resource?.type).toBe('context');
    expect(resource?.description).toBe('Example resources for testing and demonstration');
    expect(resource?.importance).toBe('low');
  });

  it('should parse file-level metadata from markdown files', async () => {
    const loader = new FilesystemResourceLoader([new MarkdownCommentMetadataParser()]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    // getting-started.md has top-level metadata
    const gettingStarted = registry.getById('examples|getting_started');
    expect(gettingStarted).toBeDefined();
    expect(gettingStarted?.type).toBe('file');
    expect(gettingStarted?.description).toBe('Quick start guide for using resources');
    expect(gettingStarted?.importance).toBe('high');

    // file-with-top-comment.md has top-level metadata only
    const topCommentFile = registry.getById('examples|file_with_top_comment');
    expect(topCommentFile).toBeDefined();
    expect(topCommentFile?.description).toBe('Example file with only top-level metadata comment');
    expect(topCommentFile?.importance).toBe('mid');

    // file-with-both-comments.md has top-level metadata
    const bothCommentsFile = registry.getById('examples|file_with_both_comments');
    expect(bothCommentsFile).toBeDefined();
    expect(bothCommentsFile?.description).toBe(
      'File with both top-level and section-level metadata'
    );
    expect(bothCommentsFile?.importance).toBe('high');
  });

  it('should parse sections from markdown files', async () => {
    const loader = new FilesystemResourceLoader([new MarkdownSectionParser()]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    const all = registry.getAll();

    // Should have sections from all markdown files
    const sections = all.filter((r) => r.type === 'section');
    expect(sections.length).toBeGreaterThan(0);

    // Check that section IDs include the context and filename
    const fileSections = sections.filter((s) => s.id.includes('examples|getting_started'));
    expect(fileSections.length).toBeGreaterThan(0);
  });

  it('should search by phrases across all resources', async () => {
    const loader = new FilesystemResourceLoader([
      new JsonResourceMetadataParser(),
      new MarkdownCommentMetadataParser(),
      new MarkdownSectionParser(),
    ]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    // Search for "testing"
    const testingResults = registry.searchByPhrases(['testing']);
    expect(testingResults.length).toBeGreaterThan(0);

    // Search for "metadata"
    const metadataResults = registry.searchByPhrases(['metadata']);
    expect(metadataResults.length).toBeGreaterThan(0);
  });

  it('should handle files with different metadata patterns', async () => {
    const loader = new FilesystemResourceLoader([new MarkdownCommentMetadataParser()]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    const all = registry.getAll();

    // File with top comment only
    const topOnly = all.find((r) => r.name === 'file-with-top-comment');
    expect(topOnly).toBeDefined();
    expect(topOnly?.description).toBeDefined();

    // File with both comments - should have file-level metadata
    const both = all.find((r) => r.name === 'file-with-both-comments');
    expect(both).toBeDefined();
    expect(both?.description).toBeDefined();

    // File with no comments should not be loaded by MarkdownCommentMetadataParser
    const noComments = all.find((r) => r.name === 'file-with-no-comments');
    expect(noComments).toBeUndefined();
  });

  it('should combine results from all parsers correctly', async () => {
    const loader = new FilesystemResourceLoader([
      new JsonResourceMetadataParser(),
      new MarkdownCommentMetadataParser(),
      new MarkdownSectionParser(),
    ]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    const all = registry.getAll();

    // Should have context-level resources (from JSON parser)
    const contexts = all.filter((r) => r.type === 'context');
    expect(contexts.length).toBeGreaterThan(0);

    // Should have file-level resources (from MarkdownComment parser)
    const files = all.filter((r) => r.type === 'file');
    expect(files.length).toBeGreaterThan(0);

    // Should have section-level resources (from MarkdownSection parser)
    const sections = all.filter((r) => r.type === 'section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should find files in subdirectories without resource.json', async () => {
    const loader = new FilesystemResourceLoader([
      new JsonResourceMetadataParser(),
      new MarkdownCommentMetadataParser(),
      new MarkdownSectionParser(),
    ]);

    registry = new InMemoryResourceRegistry(examplesDir, loader, mockLogger);
    await registry.reload();

    const all = registry.getAll();

    // Should find the nested-context parent with hierarchical ID
    const nestedContext = all.find(
      (r) => r.id === 'examples|nested_context' && r.type === 'context'
    );
    expect(nestedContext).toBeDefined();
    expect(nestedContext?.name).toBe('nested-context');

    // Should find the file in the subdir (which has no resource.json)
    const nestedFile = all.find(
      (r) => r.id === 'examples|nested_context|nested_file' && r.type === 'file'
    );
    expect(nestedFile).toBeDefined();
    expect(nestedFile?.name).toBe('nested-file');
    expect(nestedFile?.description).toBe('File in subdirectory without its own resource.json');
  });
});
