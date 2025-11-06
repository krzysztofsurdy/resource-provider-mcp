# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-01-06

### Added
- Pagination support for `getAvailableResources` and `findResourceByPhrases` tools
  - Added `limit` parameter (default: 15) to control results per page
  - Added `page` parameter (default: 1) for pagination
  - Response now includes pagination metadata: `limit`, `page`, `totalPages`, `total`
- Service layer architecture with interfaces
  - Created `SimplePaginator` service implementing `Paginator` interface
  - Created `SimpleResourceFilter` service implementing `ResourceFilter` interface
  - Created `ImportanceResourceSorter` service implementing `ResourceSorter` interface
- Comprehensive test coverage
  - Added tests for SimplePaginator (10 tests)
  - Added tests for SimpleResourceFilter (17 tests)
  - Added tests for all tools (15 tests)
  - Total: 109 tests covering all major features
- `AGENTS_EXAMPLE.md` - comprehensive guide for LLMs on using the resource provider
  - Detailed tool documentation with examples
  - Best practices and workflow patterns
  - Common use cases and anti-patterns
- Proper TypeScript typing
  - Removed `unknown` type usage except in Logger interface
  - Added `ResourceJson` interface for JSON parsing
  - No `any` types in codebase

### Changed
- Response format for `getAvailableResources` and `findResourceByPhrases`
  - Changed from array to object with `resources` array and pagination metadata
  - Breaking change: clients must now access `response.resources` instead of using response directly
- Resources are now automatically deduplicated by ID at display level
- Sections without any metadata are filtered out from all responses
- README.md streamlined by removing development-specific sections
- Code cleanup: removed redundant comments throughout codebase

### Fixed
- Proper handling of duplicate resource IDs (keeps first occurrence)

## [1.3.0] - 2025-01-05

### Added
- Automatic sorting of resources by importance (high → mid → low → null), then by ID
- Resources are now consistently ordered in all tool responses

## [1.2.2] - 2025-01-05

### Fixed
- Fixed parser tests to match correct behavior

## [1.2.1] - 2025-01-05

### Fixed
- Fixed bug where sections without metadata were incorrectly displayed in results
- Sections now require at least one metadata field (description, whenToLoad, or importance) to appear

## [1.2.0] - 2025-01-05

### Changed
- Changed `getAvailableResources` and `findResourceByPhrases` to return flat resource lists
- Removed hierarchical nesting from tool responses to minimize output size
- Internal structure remains hierarchical, only display format changed

## [1.1.0] - 2025-01-04

### Added
- Support for relative paths in `MCP_RESOURCES_DIR` environment variable
- Paths are now resolved relative to current working directory or `workingDirectory` if specified

### Changed
- Configuration now accepts both absolute and relative paths

## [1.0.1] - 2025-01-04

### Added
- Usage information in README based on NPM registry
- GitHub Actions workflow for automatic npm publishing

## [1.0.0] - 2025-01-04

### Added
- Initial release of resource-provider-mcp
- Three MCP tools: `getAvailableResources`, `findResourceByPhrases`, `getResourceContent`
- Hierarchical resource organization (context → file → section)
- Metadata support for all resource levels
  - `description`: Brief description of content
  - `whenToLoad`: Guidance on when to load the resource
  - `importance`: Priority level (high, mid, low)
- Context-level resources via `resource.json` files
- File-level metadata via HTML comments in Markdown files
- Section-level metadata via HTML comments after headings
- Whole-word phrase search across resource metadata
- Resource IDs with pipe-delimited hierarchy (e.g., `context|file|section`)
- Comprehensive test suite
- GitHub Actions for CI/CD (typecheck, lint, format, tests)
- MIT License

### Features
- Scans directory structure for `resource.json` context files
- Parses Markdown files for content and section extraction
- Metadata inheritance (section → file → context)
- Case-insensitive search with whole-word matching
- Structured resource discovery without loading full content
