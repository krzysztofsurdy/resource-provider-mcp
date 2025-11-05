# resource-provider-mcp

[![TypeCheck](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/typecheck.yml/badge.svg)](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/typecheck.yml)
[![Lint](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/lint.yml/badge.svg)](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/lint.yml)
[![Format](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/format.yml/badge.svg)](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/format.yml)
[![Tests](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/tests.yml/badge.svg)](https://github.com/krzysztofsurdy/resource-provider-mcp/actions/workflows/tests.yml)

An MCP server that gives LLMs structured access to your Markdown documentation. Instead of browsing raw files, LLMs get a hierarchical catalog where each resource has metadata telling them what it contains and when to load it.

## Why This Exists

When working with LLMs, you want them to find the right documentation quickly without loading everything into context. This MCP solves that by adding metadata to your docs and providing tools to search and load selectively.

### vs. Single index.md File

A big index.md file wastes context. If you need one section about authentication, you still load the whole 50KB file. With this MCP, you load just the section you need.

Also, a flat file has no metadata. The LLM can't tell what's important without reading everything first.

### vs. LLM Browsing Files Directly

Direct filesystem access means the LLM has to guess which files to read. It lists directories, picks files by name, reads content to see if it's relevant. That's expensive and exposes files you might not want exposed.

This MCP separates discovery from retrieval. List resources with metadata first, then load only what matters.

## Installation

```bash
git clone https://github.com/yourusername/resource-provider-mcp
cd resource-provider-mcp
npm install
npm run build
```

## Setting Up Your Documentation

This MCP organizes docs in three levels: context (directory), file, and section (heading). Each level can have metadata.

### Creating a Context

A context is a directory with a `resource.json` file. All files inside inherit its metadata.

Create a directory structure:
```
my-docs/
├── api/
│   └── resource.json
└── guides/
    └── resource.json
```

In `api/resource.json`:
```json
{
  "description": "API documentation and reference",
  "whenToLoad": "When working with the API",
  "importance": "high"
}
```

In `guides/resource.json`:
```json
{
  "description": "User guides and tutorials",
  "whenToLoad": "When learning the system",
  "importance": "mid"
}
```

### Adding Markdown Files

Put `.md` files in your context directories. Add metadata at the top if you want to override context metadata:

`api/authentication.md`:
```markdown
<!--
description: How to authenticate API requests
whenToLoad: When setting up API access
importance: high
-->

# Authentication

This guide covers authentication methods...

## OAuth Setup

Configure OAuth like this...

## API Keys

Generate API keys from...
```

The metadata comment must be at the very top of the file, before any content.

### Adding Section Metadata

You can add metadata to individual sections by putting a comment right after a heading:

```markdown
## OAuth Setup

<!--
description: OAuth 2.0 configuration steps
whenToLoad: When using OAuth authentication
importance: high
-->

OAuth setup requires...
```

### Metadata Fields

All fields are optional:

- `description`: Brief description of what this contains
- `whenToLoad`: When the LLM should load this resource (can also use lowercase `whentoload`)
- `importance`: `low`, `mid`, or `high` (guides loading priority, can also use `priority`)

Metadata precedence: section > file > context (more specific overrides less specific).

### File Structure Example

Here's a complete example:

```
my-docs/
├── api/
│   ├── resource.json
│   ├── authentication.md
│   ├── endpoints.md
│   └── errors.md
├── guides/
│   ├── resource.json
│   ├── quickstart.md
│   └── advanced.md
└── internal/
    ├── resource.json
    └── architecture.md
```

This creates IDs like:
- `api` (context)
- `api|authentication` (file)
- `api|authentication|oauth_setup` (section)
- `guides|quickstart` (file)
- `internal|architecture` (file)

### What Gets Included

The MCP only exposes:
- Directories with `resource.json` files
- `.md` files in those directories
- Sections (headings) in those `.md` files

Files without metadata comments are still included, they just won't have description, whenToLoad, or importance fields.

### Nested Contexts

You can nest contexts:

```
docs/
├── resource.json
└── api/
    ├── resource.json
    └── auth.md
```

The `api` directory is a nested context. Its ID will be `docs|api`. The auth file will be `docs|api|auth`.

## Connecting to Claude Desktop

Add this to your Claude Desktop config file:

On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "resource-provider": {
      "command": "node",
      "args": ["/absolute/path/to/resource-provider-mcp/dist/index.js"],
      "env": {
        "RESOURCE_BASE_DIR": "/absolute/path/to/your/docs"
      }
    }
  }
}
```

Replace the paths with actual absolute paths on your system.

Restart Claude Desktop. The MCP should connect automatically.

## Testing Your Setup

After building, test the tools directly:

List everything:
```bash
npm run tool:getAvailableResources '{}'
```

Get a specific resource:
```bash
npm run tool:getResourceContent '{"id":"api|authentication"}'
```

Search for resources:
```bash
npm run tool:findResourceByPhrases '{"phrases":["authentication"]}'
```

These commands use the tools directly without going through MCP, useful for debugging your doc structure.

## Tips for Good Documentation

1. **Use clear descriptions**: The LLM uses these to decide what to load. "API authentication methods" is better than "Auth stuff".

2. **Set importance correctly**: Mark critical docs as `high`, useful docs as `mid`, and reference docs as `low`.

3. **Write good whenToLoad text**: This guides the LLM. "When setting up authentication" or "When debugging errors" works well.

4. **Organize logically**: Group related docs in the same context. Keep the hierarchy shallow when possible.

5. **Split long files**: If a file has multiple topics, consider splitting it or adding section metadata so the LLM can load just the relevant section.

6. **Use descriptive headings**: Section names become part of the ID. "OAuth Setup" is better than "Setup".

## Development

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Build:
```bash
npm run build
```

The TypeScript source is in `src/`, compiled output goes to `dist/`.

## How the LLM Uses This

Once connected, Claude can use three tools:

### List Resources

```
getAvailableResources with no arguments
```

Shows the full hierarchy with metadata but no content. Claude can see what exists and decide what to load.

### Search Resources

```
findResourceByPhrases with phrases: ["authentication", "oauth"]
```

Finds resources matching those keywords. Search is whole-word and case-insensitive.

### Load Content

```
getResourceContent with id: "api|authentication|oauth_setup"
```

Loads just that section. IDs use pipe delimiters to show hierarchy.

## How It Works

The MCP server:
1. Scans your docs directory for `resource.json` files (contexts)
2. Finds all `.md` files in those directories
3. Parses metadata comments from files and sections
4. Builds a hierarchical catalog with IDs like `context|file|section`
5. Exposes three tools for listing, searching, and loading resources

When Claude calls a tool, the server returns just what was requested. Listing shows metadata only, loading shows content.

## Troubleshooting

### MCP Not Connecting

Check the Claude Desktop logs. On macOS: `~/Library/Logs/Claude/mcp*.log`

Common issues:
- Wrong path to dist/index.js
- Wrong path to RESOURCE_BASE_DIR
- Node.js not in PATH
- Build not run (forgot `npm run build`)

### No Resources Showing

Make sure:
- Your docs directory has directories with `resource.json` files
- The `RESOURCE_BASE_DIR` path is correct and absolute
- You have at least one `.md` file in a context directory

### Metadata Not Working

Check:
- Metadata comment is at the very top of the file (for file metadata)
- Metadata comment is right after the heading (for section metadata)
- Comment uses `<!--` and `-->` format
- Field names are spelled correctly (`description`, `whenToLoad`, `importance`)
- JSON in resource.json is valid

### Search Not Finding Resources

Remember:
- Search is whole-word only. "config" won't match "configuration"
- All phrases must match
- Search is case-insensitive

## License

MIT

## Author

Krzysztof Surdy
