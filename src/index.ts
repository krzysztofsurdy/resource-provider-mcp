#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { FilesystemResourceLoader } from './services/FilesystemResourceLoader.js';
import { JsonResourceMetadataParser } from './services/parsers/JsonResourceMetadataParser.js';
import { MarkdownCommentMetadataParser } from './services/parsers/MarkdownCommentMetadataParser.js';
import { MarkdownSectionParser } from './services/parsers/MarkdownSectionParser.js';
import { InMemoryResourceRegistry } from './services/InMemoryResourceRegistry.js';
import { ConsoleLogger } from './services/ConsoleLogger.js';
import { getConfig } from './config/config.js';
import { GetAvailableResourcesTool } from './tools/getAvailableResources.js';
import { GetResourceContentTool } from './tools/getResourceContent.js';
import { FindResourceByPhrasesTool } from './tools/findResourceByPhrases.js';

async function main(): Promise<void> {
  const logger = new ConsoleLogger();

  let config;
  try {
    config = getConfig();
  } catch (error) {
    logger.error('Failed to load configuration', { error });
    process.exit(1);
  }

  const loader = new FilesystemResourceLoader([
    new JsonResourceMetadataParser(),
    new MarkdownCommentMetadataParser(),
    new MarkdownSectionParser(),
  ]);

  const registry = new InMemoryResourceRegistry(config.baseDir, loader, logger);

  try {
    await registry.reload();
  } catch (error) {
    logger.error('Failed to load resources', { error });
    process.exit(1);
  }

  const getAvailableResourcesTool = new GetAvailableResourcesTool(registry);
  const getResourceContentTool = new GetResourceContentTool(registry);
  const findResourceByPhrasesTool = new FindResourceByPhrasesTool(registry);

  const server = new Server(
    { name: 'resource-provider-mcp', version: '1.4.0' },
    { capabilities: { tools: {} } }
  );

  const GetAvailableResourcesSchema = z.object({
    prefix: z.string().optional(),
    limit: z.number().int().positive().optional(),
    page: z.number().int().positive().optional(),
  });

  const GetResourceContentSchema = z.object({
    id: z.string(),
    showChildren: z.boolean().optional(),
  });

  const FindResourceByPhrasesSchema = z.object({
    phrases: z.array(z.string()).min(1),
    limit: z.number().int().positive().optional(),
    page: z.number().int().positive().optional(),
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'getAvailableResources',
        description:
          "List all resources (formatted). Optional prefix to narrow by id prefix like 'tests|testing'. Content is not included. Returns paginated results.",
        inputSchema: {
          type: 'object',
          properties: {
            prefix: {
              type: 'string',
              description: 'Optional ID prefix to filter resources',
            },
            limit: {
              type: 'number',
              description: 'Number of resources per page (default: 15)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
        },
      },
      {
        name: 'getResourceContent',
        description: 'Retrieves the full content of a resource and optionally its children.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Resource ID',
            },
            showChildren: {
              type: 'boolean',
              description: 'Include children in output',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'findResourceByPhrases',
        description:
          'Searches for resources by phrases (case-insensitive whole-word match). Returns paginated results.',
        inputSchema: {
          type: 'object',
          properties: {
            phrases: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of search phrases',
            },
            limit: {
              type: 'number',
              description: 'Number of resources per page (default: 15)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
          required: ['phrases'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (request.params.name === 'getAvailableResources') {
        const args = GetAvailableResourcesSchema.parse(request.params.arguments);
        const formatted = await getAvailableResourcesTool.execute(args);

        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      }

      if (request.params.name === 'getResourceContent') {
        const args = GetResourceContentSchema.parse(request.params.arguments);
        const result = await getResourceContentTool.execute(args);

        return {
          content: [
            {
              type: 'text',
              text: result.text,
            },
          ],
          isError: result.isError,
        };
      }

      if (request.params.name === 'findResourceByPhrases') {
        const args = FindResourceByPhrasesSchema.parse(request.params.arguments);
        const formatted = await findResourceByPhrasesTool.execute(args);

        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Tool execution error', { tool: request.params.name, error: errorMessage });
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Resource Provider MCP server running via stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
