#!/usr/bin/env node
import { FilesystemResourceLoader } from '../dist/services/FilesystemResourceLoader.js';
import { JsonResourceMetadataParser } from '../dist/services/parsers/JsonResourceMetadataParser.js';
import { MarkdownCommentMetadataParser } from '../dist/services/parsers/MarkdownCommentMetadataParser.js';
import { MarkdownSectionParser } from '../dist/services/parsers/MarkdownSectionParser.js';
import { InMemoryResourceRegistry } from '../dist/services/InMemoryResourceRegistry.js';
import { ConsoleLogger } from '../dist/services/ConsoleLogger.js';
import { getConfig } from '../dist/config/config.js';
import { GetAvailableResourcesTool } from '../dist/tools/getAvailableResources.js';
import { GetResourceContentTool } from '../dist/tools/getResourceContent.js';
import { FindResourceByPhrasesTool } from '../dist/tools/findResourceByPhrases.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toolName = process.argv[2];
const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};

if (!toolName) {
  console.error('Usage: node scripts/test-direct.mjs <toolName> <arguments>');
  console.error('\nAvailable tools:');
  console.error('  getAvailableResources [{"prefix":"..."}]');
  console.error('  getResourceContent {"id":"..."}');
  console.error('  findResourceByPhrases {"phrases":["..."]}');
  console.error('\nExamples:');
  console.error('  npm run tool:list');
  console.error('  npm run tool:get');
  console.error('  npm run tool:search');
  process.exit(1);
}

async function main() {
  console.log(`\nTesting tool: ${toolName}`);
  console.log(`Arguments:`, JSON.stringify(args, null, 2));
  console.log('\n--- Loading Resources ---\n');

  const logger = new ConsoleLogger();
  const config = getConfig();

  const loader = new FilesystemResourceLoader([
    new JsonResourceMetadataParser(),
    new MarkdownCommentMetadataParser(),
    new MarkdownSectionParser(),
  ]);

  const registry = new InMemoryResourceRegistry(config.baseDir, loader, logger);
  await registry.reload();

  const getAvailableResourcesTool = new GetAvailableResourcesTool(registry);
  const getResourceContentTool = new GetResourceContentTool(registry);
  const findResourceByPhrasesTool = new FindResourceByPhrasesTool(registry);

  console.log('\n--- Executing Tool ---\n');

  try {
    if (toolName === 'getAvailableResources') {
      const result = await getAvailableResourcesTool.execute(args);
      const parsed = JSON.parse(result);

      console.log('Result:\n');
      console.log(JSON.stringify(parsed, null, 2));
      console.log(`\nTotal: ${parsed.total} resources`);
    } else if (toolName === 'getResourceContent') {
      if (!args.id) {
        throw new Error('id parameter is required');
      }

      const result = await getResourceContentTool.execute(args);

      if (result.isError) {
        console.error(`Error: ${result.text}`);
        process.exit(1);
      }

      console.log('Result:\n');
      console.log(result.text);
    } else if (toolName === 'findResourceByPhrases') {
      if (!args.phrases || args.phrases.length === 0) {
        throw new Error('phrases parameter is required');
      }

      const result = await findResourceByPhrasesTool.execute(args);
      const parsed = JSON.parse(result);

      console.log('Result:\n');
      console.log(JSON.stringify(parsed, null, 2));
      console.log(`\nFound: ${parsed.total} resources`);
    } else {
      console.error(`Unknown tool: ${toolName}`);
      console.error(
        '\nAvailable tools: getAvailableResources, getResourceContent, findResourceByPhrases'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
