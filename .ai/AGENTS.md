# Resource Provider MCP: LLM Instructions

## System Description

This MCP exposes a hierarchical catalog of Markdown resources. Each resource has an ID, type (context/file/section), and optional metadata (description, whenToLoad, importance). Resources are organized in three levels using pipe-delimited IDs.

## Tools

### getAvailableResources

Input: `{"prefix": "optional_string"}`

Output: JSON array of resources with fields: id, name, type, description, whenToLoad, importance, children. Content field is not included.

Behavior:
- Omit prefix to list all resources
- Provide prefix to filter by hierarchical ID (e.g., "docs" returns all resources starting with "docs|")
- Returns nested structure with children arrays populated

### getResourceContent

Input: `{"id": "required_string", "showChildren": true|false}`

Output: Plain text with metadata header followed by Markdown content.

Behavior:
- id parameter is required and must match an existing resource ID exactly
- Returns error if resource ID does not exist
- showChildren parameter is optional, defaults to false
- When showChildren is true, appends a list of child resources after the content

### findResourceByPhrases

Input: `{"phrases": ["array", "of", "strings"]}`

Output: JSON array of resources matching all phrases. Includes metadata fields but not content.

Behavior:
- All phrases must match for a resource to be included
- Matching is case-insensitive and whole-word only
- Searches across name, description, and whenToLoad fields
- Returns empty array if no matches found

## Operational Rules

1. Resource IDs use pipe delimiters (|) to represent hierarchy. Format: `context|file|section`. Each segment is slugified (lowercase, underscores replace special chars).

2. Never construct or guess resource IDs. Always obtain IDs from getAvailableResources or findResourceByPhrases output.

3. Phrase search performs whole-word matching only. The phrase "config" will not match the word "configuration". Use complete words.

4. Metadata fields have specific meanings:
   - importance: "high" = load immediately when relevant
   - importance: "mid" = load when needed
   - importance: "low" = load only if specifically requested
   - whenToLoad: describes conditions when this resource is relevant
   - description: summarizes resource content

5. Load sections (type: "section") instead of files (type: "file") when you need specific information. A file may contain multiple sections. Loading a section reduces context usage.

6. Track loaded resource IDs within a conversation. Do not load the same resource multiple times.

7. This MCP is read-only. No modification operations are available.

## Execution Sequence

Standard workflow:

1. Call getAvailableResources with no prefix, or findResourceByPhrases with keywords
2. Examine returned metadata (description, whenToLoad, importance)
3. Select resource ID based on metadata relevance
4. Call getResourceContent with selected ID
5. Process content to answer user query

Alternative workflow for known context:

1. Call getAvailableResources with prefix to filter specific branch
2. Examine filtered results
3. Select and load resource

## Type Hierarchy

Three resource types exist:

- context: represents a directory with resource.json, contains files and subdirectories
- file: represents a .md file, contains sections
- section: represents a heading within a .md file, contains content

Hierarchy rules:
- context can have context or file children
- file can have section children
- section has no children

ID structure reflects hierarchy:
- context: `context_name`
- file: `context_name|file_name`
- section: `context_name|file_name|section_name`

## Metadata Precedence

When multiple levels define the same field:
1. Section metadata overrides file metadata
2. File metadata overrides context metadata
3. Context metadata is the default

## Error Conditions

Resource ID not found:
- getResourceContent returns error text
- Re-execute getAvailableResources to obtain valid IDs

Empty search results:
- findResourceByPhrases returns empty array
- Retry with different phrases or use getAvailableResources

Invalid input parameters:
- Tools return error messages
- Check parameter spelling and types

## Context Optimization

File sizes vary. A file may contain 50KB of content. A section typically contains 2-5KB.

Strategy:
- List resources first to see structure
- Use prefix filtering to narrow search space
- Load sections not files when content is within a specific section
- Check content field is absent in getAvailableResources output (metadata only)

Comparison:
- Loading full file: 50KB context usage
- Loading specific section: 2-5KB context usage
- Listing all resources: 5-10KB context usage (no content)

## Multi-MCP Context

When multiple MCPs are available:

This MCP provides:
- Structured documentation access
- Metadata-guided resource selection
- Hierarchical organization

Filesystem MCP provides:
- Raw file read/write operations
- Directory traversal
- File system modifications

Search MCP provides:
- Full-text search
- Substring and fuzzy matching

Do not confuse resource IDs from this MCP with file paths from filesystem MCP. They are different namespaces.

## Example Sequences

User query: "How to configure authentication"

Execution:
```
1. findResourceByPhrases({"phrases": ["authentication", "configuration"]})
2. Receive: [{"id": "docs|api|auth", "importance": "high", ...}]
3. getResourceContent({"id": "docs|api|auth"})
4. Process returned content
5. Respond to user with extracted information
```

User query: "What documentation exists"

Execution:
```
1. getAvailableResources({})
2. Receive: hierarchical tree of all resources
3. Format and present structure to user
```

User query: "Show me API endpoint documentation"

Execution:
```
1. getAvailableResources({"prefix": "docs|api"})
2. Receive: filtered resources under docs|api
3. Identify relevant section (e.g., "docs|api|endpoints")
4. getResourceContent({"id": "docs|api|endpoints"})
5. Present content to user
```

## Important Constraints

- IDs are case-sensitive in practice but generated from case-insensitive slugification
- Phrase search is case-insensitive and whole-word only
- Pipe character (|) is reserved for ID hierarchy, never appears in ID segments
- Resource IDs may change between MCP server restarts if file structure changes
- Always call getAvailableResources at conversation start to get current IDs
- showChildren parameter in getResourceContent only shows child metadata, not child content

## Output Format

getAvailableResources returns JSON structure:
```json
{
  "id": "string",
  "name": "string",
  "type": "context|file|section",
  "description": "string|null",
  "whenToLoad": "string|null",
  "importance": "low|mid|high|null",
  "children": [nested resources]
}
```

getResourceContent returns text:
```
# resource-name

**Description:** text or absent
**When to load:** text or absent
**Importance:** low|mid|high or absent

---

[markdown content]
```

findResourceByPhrases returns JSON array with same structure as getAvailableResources but flattened (no nested children).
