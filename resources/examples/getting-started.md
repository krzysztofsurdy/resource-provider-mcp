<!--
description: Quick start guide for using resources
whenToLoad: When you first start using the system
importance: high
-->

# Getting Started

This guide will help you understand how to use the resource provider system.

## Overview

The Resource Provider MCP allows you to organize and access markdown-based resources with rich metadata.

## Basic Concepts

### Resources
Resources are organized hierarchically:
- **Contexts**: Top-level containers (directories with resource.json)
- **Files**: Markdown files within contexts
- **Sections**: Headings within markdown files

### Metadata
Each resource can have:
- `description`: What the resource provides
- `whenToLoad`: When to use this resource
- `importance`: Priority level (low, mid, high)

## Example Usage

### Listing Resources
Use `getAvailableResources` to see all available resources.

### Getting Content
Use `getResourceContent` with a resource ID to retrieve its content.

### Searching
Use `findResourceByPhrases` to search for specific topics.

## Next Steps

Explore the example resources to see how they're structured!
