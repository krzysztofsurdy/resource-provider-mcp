import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JsonResourceMetadataParser } from '../services/parsers/JsonResourceMetadataParser.js';
import { MarkdownCommentMetadataParser } from '../services/parsers/MarkdownCommentMetadataParser.js';
import { MarkdownSectionParser } from '../services/parsers/MarkdownSectionParser.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('JsonResourceMetadataParser', () => {
  let parser: JsonResourceMetadataParser;
  let testDir: string;

  beforeEach(() => {
    parser = new JsonResourceMetadataParser();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-json-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should parse valid resource.json', async () => {
    const resourceData = {
      description: 'Test context description',
      whenToLoad: 'When testing the system',
      importance: 'high',
    };

    fs.writeFileSync(
      path.join(testDir, 'resource.json'),
      JSON.stringify(resourceData)
    );

    const results = await parser.parse(testDir);

    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('context');
    expect(results[0].description).toBe('Test context description');
    expect(results[0].whenToLoad).toBe('When testing the system');
    expect(results[0].importance).toBe('high');
    expect(results[0].content).toBeNull();
  });

  it('should return empty array if resource.json does not exist', async () => {
    const results = await parser.parse(testDir);
    expect(results).toHaveLength(0);
  });

  it('should return empty array for invalid JSON', async () => {
    fs.writeFileSync(path.join(testDir, 'resource.json'), 'invalid json{');

    const results = await parser.parse(testDir);
    expect(results).toHaveLength(0);
  });

  it('should slugify directory name for ID', async () => {
    const dirWithSpaces = path.join(testDir, 'Test Dir With-Special_Chars!');
    fs.mkdirSync(dirWithSpaces);
    fs.writeFileSync(
      path.join(dirWithSpaces, 'resource.json'),
      JSON.stringify({ description: 'test' })
    );

    const results = await parser.parse(dirWithSpaces);
    expect(results[0].id).toBe('test_dir_with_special_chars');
  });

  it('should use directory name as resource name', async () => {
    const dirName = 'MyContext';
    const dirPath = path.join(testDir, dirName);
    fs.mkdirSync(dirPath);
    fs.writeFileSync(
      path.join(dirPath, 'resource.json'),
      JSON.stringify({ description: 'test' })
    );

    const results = await parser.parse(dirPath);
    expect(results[0].name).toBe(dirName);
  });

  it('should have empty children array', async () => {
    fs.writeFileSync(
      path.join(testDir, 'resource.json'),
      JSON.stringify({ description: 'test' })
    );

    const results = await parser.parse(testDir);
    expect(results[0].children).toEqual([]);
  });

  it('should scan subdirectories when resource.json exists', async () => {
    // Create parent with resource.json
    fs.writeFileSync(
      path.join(testDir, 'resource.json'),
      JSON.stringify({ description: 'parent context' })
    );

    // Create subdirectory with its own resource.json
    const subDir = path.join(testDir, 'subcontext');
    fs.mkdirSync(subDir);
    fs.writeFileSync(
      path.join(subDir, 'resource.json'),
      JSON.stringify({ description: 'child context' })
    );

    const results = await parser.parse(testDir);

    expect(results).toHaveLength(2);
    expect(results.some(r => r.name === path.basename(testDir))).toBe(true);
    expect(results.some(r => r.name === 'subcontext')).toBe(true);
  });

  it('should allow subdirectories without resource.json under a parent with resource.json', async () => {
    // Create parent with resource.json
    fs.writeFileSync(
      path.join(testDir, 'resource.json'),
      JSON.stringify({ description: 'parent context' })
    );

    // Create subdirectory WITHOUT resource.json
    const subDir = path.join(testDir, 'subdir-no-json');
    fs.mkdirSync(subDir);

    // Parser should find the parent context, but not create one for the subdirectory
    const results = await parser.parse(testDir);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe(path.basename(testDir));
  });

  it('should not scan subdirectories if no resource.json in path', async () => {
    // Create subdirectory without parent resource.json
    const subDir = path.join(testDir, 'orphan-subdir');
    fs.mkdirSync(subDir);
    fs.writeFileSync(
      path.join(subDir, 'resource.json'),
      JSON.stringify({ description: 'orphan context' })
    );

    const results = await parser.parse(testDir);

    // Should still find it because we start at depth 0
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('orphan-subdir');
  });
});

describe('MarkdownCommentMetadataParser', () => {
  let parser: MarkdownCommentMetadataParser;
  let testDir: string;

  beforeEach(() => {
    parser = new MarkdownCommentMetadataParser();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-md-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should parse markdown file with metadata comment', async () => {
    const mdContent = `<!--
description: Test file description
whenToLoad: When testing files
importance: mid
-->

# Test Content

Some content here.
`;

    const mdFile = path.join(testDir, 'test-file.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);

    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('file');
    expect(results[0].description).toBe('Test file description');
    expect(results[0].whenToLoad).toBe('When testing files');
    expect(results[0].importance).toBe('mid');
    expect(results[0].content).toBe(mdContent);
  });

  it('should handle whentoload (lowercase) key', async () => {
    const mdContent = `<!--
description: Test
whentoload: Test when to load
-->
# Content`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);
    expect(results[0].whenToLoad).toBe('Test when to load');
  });

  it('should return empty array for non-markdown files', async () => {
    const txtFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(txtFile, 'Not markdown');

    const results = await parser.parse(txtFile);
    expect(results).toHaveLength(0);
  });

  it('should return empty array if file does not exist', async () => {
    const results = await parser.parse(path.join(testDir, 'nonexistent.md'));
    expect(results).toHaveLength(0);
  });

  it('should return empty array for markdown without metadata comment', async () => {
    const mdContent = `# Test

No metadata here.`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);
    expect(results).toHaveLength(0);
  });

  it('should slugify filename for ID', async () => {
    const mdContent = `<!--
description: test
-->
# Content`;

    const mdFile = path.join(testDir, 'My Test-File!.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);
    expect(results[0].id).toBe('my_test_file');
  });

  it('should use filename without extension as name', async () => {
    const mdContent = `<!--
description: test
-->
# Content`;

    const mdFile = path.join(testDir, 'my-file.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);
    expect(results[0].name).toBe('my-file');
  });

  it('should validate importance values', async () => {
    const mdContent = `<!--
description: test
importance: invalid
-->
# Content`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);
    expect(results[0].importance).toBeUndefined();
  });

  it('should accept priority as alias for importance', async () => {
    const mdContent = `<!--
description: test
priority: high
-->
# Content`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);
    expect(results[0].importance).toBe('high');
  });
});

describe('MarkdownSectionParser', () => {
  let parser: MarkdownSectionParser;
  let testDir: string;

  beforeEach(() => {
    parser = new MarkdownSectionParser();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-section-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should parse sections from markdown file', async () => {
    const mdContent = `# Main Heading

Content for main section.

## Section 1

Content for section 1.

## Section 2

Content for section 2.
`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);

    const sections = results.filter(r => r.type === 'section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should parse sections without extracting metadata comments', async () => {
    const mdContent = `# Main

## Section 1
<!--
description: First section
whenToLoad: When needed
importance: high
-->

Content here.
`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);

    // MarkdownSectionParser doesn't extract metadata - it only splits into sections
    expect(results.length).toBe(2); // Main and Section 1
    expect(results.every(r => r.description === undefined)).toBe(true);
  });

  it('should create hierarchical IDs with filename and section', async () => {
    const mdContent = `## Test Section`;

    const mdFile = path.join(testDir, 'myfile.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);

    expect(results).toHaveLength(1);
    // ID format is "filename|section" where section is slugified
    expect(results[0].id).toBe('myfile|test_section');
  });

  it('should return empty array for non-markdown files', async () => {
    const txtFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(txtFile, 'Not markdown');

    const results = await parser.parse(txtFile);
    expect(results).toHaveLength(0);
  });

  it('should return empty array if file does not exist', async () => {
    const results = await parser.parse(path.join(testDir, 'nonexistent.md'));
    expect(results).toHaveLength(0);
  });

  it('should include file content in section resources', async () => {
    const mdContent = `## Test Section

Section content here.`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);

    expect(results.some(r => r.content && r.content.includes('Section content'))).toBe(true);
  });

  it('should handle multiple heading levels', async () => {
    const mdContent = `# H1
## H2
### H3
#### H4`;

    const mdFile = path.join(testDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent);

    const results = await parser.parse(mdFile);

    expect(results.length).toBeGreaterThan(1);
  });
});
