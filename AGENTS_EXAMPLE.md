# Resource Provider MCP - Agent Instructions

This MCP provides structured access to project documentation organized as searchable resources. Load only what you need for the current task.

## Available Tools

### mcp__resource-provider__findResourceByPhrases

Search for resources by keywords.

**Parameters:**
- `phrases`: Array of search terms (required)
- `limit`: Results per page (optional, default: 15)
- `page`: Page number (optional, default: 1)

**Returns:** JSON with `{resources: [...], limit, page, totalPages, total}`

**Use when:**
- You know what topic you're looking for
- You have specific keywords in mind
- You need to find documentation about a feature/concept

**Example:**
```json
{"phrases": ["authentication", "oauth"]}
```

---

### mcp__resource-provider__getAvailableResources

List all available resources with optional filtering.

**Parameters:**
- `prefix`: Filter by ID prefix (optional, e.g., "api")
- `limit`: Results per page (optional, default: 15)
- `page`: Page number (optional, default: 1)

**Returns:** JSON with `{resources: [...], limit, page, totalPages, total}`

**Use when:**
- Exploring what documentation exists
- Browsing a specific area using prefix
- Getting oriented in a new codebase

**Example:**
```json
{"prefix": "api", "limit": 10}
```

---

### mcp__resource-provider__getResourceContent

Load the full content of a specific resource.

**Parameters:**
- `id`: Resource ID (required, e.g., "api|authentication")
- `showChildren`: Include list of child resources (optional, default: false)

**Returns:** Object with `{text: "...", isError: boolean}`

**Use when:**
- You've identified the resource you need via search or listing
- You need the actual documentation content
- You're ready to load specific information

**Example:**
```json
{"id": "api|authentication", "showChildren": false}
```

---

## Resource Structure

Resources use hierarchical IDs with pipe delimiters:

1. **Context** (type: "context"): `api`
2. **File** (type: "file"): `api|authentication`
3. **Section** (type: "section"): `api|authentication|oauth_setup`

## Metadata Fields

Each resource may include:

- `description`: Brief content description
- `whenToLoad`: When this resource is relevant
- `importance`: Priority level (high/mid/low)

Sections without metadata are filtered out.

## Tool Selection

**Search vs List:**
- Use search when you have specific topics in mind
- Use listing for exploration and browsing
- Both support pagination (default 15 items per page)

**When to load content:**
- After identifying relevant resources
- Only load what's needed for the current task
- Check `whenToLoad` metadata to determine relevance

## Workflow Pattern

```
1. Search or list to find relevant resources
2. Review metadata (description, whenToLoad, importance)
3. Load content for resources that match your task
4. Load additional resources only if referenced or required
```

## Examples

### Example 1: Implementing Authentication

```
Step 1: Search for relevant resources
mcp__resource-provider__findResourceByPhrases({"phrases": ["authentication"]})

Step 2: Review results, identify relevant IDs

Step 3: Load the main resource
mcp__resource-provider__getResourceContent({"id": "api|authentication"})

Step 4: Load specific sections if needed
mcp__resource-provider__getResourceContent({"id": "api|authentication|oauth_setup"})
```

### Example 2: Exploring New Codebase

```
Option A - Search for common topics:
mcp__resource-provider__findResourceByPhrases({"phrases": ["architecture", "overview"]})

Option B - Browse all resources:
mcp__resource-provider__getAvailableResources({"limit": 15})

Then load high-importance resources found in results.
```

### Example 3: Working on Specific Module

```
Option A - Search:
mcp__resource-provider__findResourceByPhrases({"phrases": ["module-name"]})

Option B - List with prefix:
mcp__resource-provider__getAvailableResources({"prefix": "module-name"})

Then load relevant module documentation.
```

### Example 4: Debugging Issue

```
mcp__resource-provider__findResourceByPhrases({"phrases": ["error", "troubleshooting"]})

Load debugging guides from results:
mcp__resource-provider__getResourceContent({"id": "troubleshooting|common_errors"})
```

## Search Behavior

- **Case-insensitive**: "Auth" matches "authentication"
- **Whole-word matching**: "config" does NOT match "configuration"
- **OR logic**: Matches any phrase in the array
- **Searchable fields**: name, description, whenToLoad

## Pagination

Both search and list return pagination metadata:

```json
{
  "resources": [...],
  "limit": 15,
  "page": 1,
  "totalPages": 3,
  "total": 42
}
```

Check `totalPages` to determine if more results exist.

## Important Rules

1. **Load selectively**: Only load resources relevant to your current task
2. **Use metadata**: Check `whenToLoad` and `importance` before loading
3. **Handle pagination**: Don't increase limit excessively, use page parameter
4. **Search with multiple terms**: Broaden results with related keywords
5. **Navigate hierarchically**: Start broad (file level), then load specific sections if needed
6. **Don't load speculatively**: Avoid "just in case" loading
7. **Don't reload**: Don't load the same resource multiple times
8. **Resources are cached**: Changes to files require MCP server restart

## Tool Call Format

All tools accept JSON arguments:

```
mcp__resource-provider__findResourceByPhrases({"phrases": ["keyword"]})
mcp__resource-provider__getAvailableResources({"prefix": "api", "limit": 10})
mcp__resource-provider__getResourceContent({"id": "api|auth"})
```

## Importance Levels

Resources are sorted by importance:

- **high**: Critical documentation, load first when relevant
- **mid**: Useful documentation, load when needed
- **low**: Reference documentation, load only if specifically required

High-importance resources appear first in search and listing results.
