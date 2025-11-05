#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FilesystemResourceLoader } from "./services/FilesystemResourceLoader.js";
import { JsonResourceMetadataParser } from "./services/parsers/JsonResourceMetadataParser.js";
import { MarkdownCommentMetadataParser } from "./services/parsers/MarkdownCommentMetadataParser.js";
import { MarkdownSectionParser } from "./services/parsers/MarkdownSectionParser.js";
import { InMemoryResourceRegistry } from "./services/InMemoryResourceRegistry.js";
import { ConsoleLogger } from "./services/ConsoleLogger.js";
import { getConfig } from "./config/config.js";

const logger = new ConsoleLogger();
const config = getConfig();

const loader = new FilesystemResourceLoader([
  new JsonResourceMetadataParser(),
  new MarkdownCommentMetadataParser(),
  new MarkdownSectionParser(),
]);

const registry = new InMemoryResourceRegistry(config.baseDir, loader, logger);

await registry.reload();

const server = new Server(
  { name: "resource-provider-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const GetAvailableResourcesSchema = z.object({
  prefix: z.string().optional(),
});

const GetResourceContentSchema = z.object({
  id: z.string(),
  showChildren: z.boolean().optional(),
});

const FindResourceByPhrasesSchema = z.object({
  phrases: z.array(z.string()).min(1),
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "getAvailableResources",
      description:
        "List all resources (formatted). Optional prefix to narrow by id prefix like 'tests|testing'. Content is not included.",
      inputSchema: {
        type: "object",
        properties: {
          prefix: {
            type: "string",
            description: "Optional ID prefix to filter resources",
          },
        },
      },
    },
    {
      name: "getResourceContent",
      description: "Retrieves the full content of a resource and optionally its children.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Resource ID",
          },
          showChildren: {
            type: "boolean",
            description: "Include children in output",
          },
        },
        required: ["id"],
      },
    },
    {
      name: "findResourceByPhrases",
      description:
        "Searches for resources by phrases (case-insensitive whole-word match).",
      inputSchema: {
        type: "object",
        properties: {
          phrases: {
            type: "array",
            items: { type: "string" },
            description: "Array of search phrases",
          },
        },
        required: ["phrases"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "getAvailableResources") {
      const args = GetAvailableResourcesSchema.parse(request.params.arguments);
      const items = args.prefix
        ? registry.getByPrefix(args.prefix)
        : registry.getAll();

      const formatted = JSON.stringify(
        items.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          description: r.description ?? null,
          whenToLoad: r.whenToLoad ?? null,
          importance: r.importance ?? null,
          childrenCount: r.children.length,
        })),
        null,
        2
      );

      return {
        content: [
          {
            type: "text",
            text: formatted,
          },
        ],
      };
    }

    if (request.params.name === "getResourceContent") {
      const args = GetResourceContentSchema.parse(request.params.arguments);
      const resource = registry.getById(args.id);

      if (!resource) {
        return {
          content: [
            {
              type: "text",
              text: `Resource '${args.id}' not found.`,
            },
          ],
          isError: true,
        };
      }

      let output = `# ${resource.name}\n\n`;
      if (resource.description) output += `**Description:** ${resource.description}\n\n`;
      if (resource.whenToLoad) output += `**When to load:** ${resource.whenToLoad}\n\n`;
      if (resource.content) output += `\n${resource.content}\n`;

      if (args.showChildren && resource.children.length > 0) {
        output += `\n## Children (${resource.children.length})\n\n`;
        for (const child of resource.children) {
          output += `### ${child.name} (${child.id})\n`;
          if (child.description) output += `${child.description}\n`;
          output += `\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    }

    if (request.params.name === "findResourceByPhrases") {
      const args = FindResourceByPhrasesSchema.parse(request.params.arguments);
      const results = registry.searchByPhrases(args.phrases);

      const formatted = JSON.stringify(
        results.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          description: r.description ?? null,
          whenToLoad: r.whenToLoad ?? null,
          importance: r.importance ?? null,
        })),
        null,
        2
      );

      return {
        content: [
          {
            type: "text",
            text: formatted,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

logger.info("Resource Provider MCP server running via stdio");
