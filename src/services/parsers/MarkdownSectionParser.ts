import fs from "fs";
import path from "path";
import { ResourceParser } from "../../core/interfaces/ResourceParser";
import { Resource } from "../../core/interfaces/Resource";

export class MarkdownSectionParser implements ResourceParser {
    private readonly HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/gm;
    private readonly MAX_DEPTH = 10;

    async parse(inputPath: string, depth = 0, contextPrefix = ''): Promise<Resource[]> {
        if (!fs.existsSync(inputPath)) return [];
        if (depth > this.MAX_DEPTH) return [];

        let stats;
        try {
            stats = fs.statSync(inputPath);
        } catch (error) {
            console.error(`Failed to stat ${inputPath}:`, error);
            return [];
        }

        if (stats.isDirectory()) {
            const results: Resource[] = [];

            const resourceJsonPath = path.join(inputPath, 'resource.json');
            let newContextPrefix = contextPrefix;
            if (fs.existsSync(resourceJsonPath)) {
                const dirName = path.basename(inputPath);
                const contextId = this.slugify(dirName);
                newContextPrefix = contextPrefix ? `${contextPrefix}|${contextId}` : contextId;
            }

            try {
                const entries = fs.readdirSync(inputPath);
                for (const entry of entries) {
                    const fullPath = path.join(inputPath, entry);
                    const parsed = await this.parse(fullPath, depth + 1, newContextPrefix);
                    results.push(...parsed);
                }
            } catch (error) {
                console.error(`Failed to read directory ${inputPath}:`, error);
            }
            return results;
        }

        if (!inputPath.endsWith(".md")) return [];

        let text: string;
        try {
            text = fs.readFileSync(inputPath, "utf8");
        } catch (error) {
            console.error(`Failed to read file ${inputPath}:`, error);
            return [];
        }
        const fileName = path.basename(inputPath, ".md");
        const fileId = this.slugify(fileName);
        const fileFullId = contextPrefix ? `${contextPrefix}|${fileId}` : fileId;
        const sections: Resource[] = [];

        let lastIndex = 0;
        const matches = [...text.matchAll(this.HEADING_RE)];

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const level = match[1].length;
            const title = match[2].trim();
            const start = match.index ?? 0;
            const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
            const body = text.slice(start, end).trim();
            const sectionId = this.slugify(title);

            sections.push({
                id: `${fileFullId}|${sectionId}`,
                name: title,
                type: "section",
                description: undefined,
                whenToLoad: undefined,
                importance: undefined,
                children: [],
                content: body,
            });
        }

        return sections;
    }

    private slugify(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }
}