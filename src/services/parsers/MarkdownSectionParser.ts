import fs from "fs";
import path from "path";
import { ResourceParser } from "../../core/interfaces/ResourceParser";
import { Resource } from "../../core/interfaces/Resource";

export class MarkdownSectionParser implements ResourceParser {
    private readonly HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/gm;

    async parse(inputPath: string): Promise<Resource[]> {
        if (!inputPath.endsWith(".md") || !fs.existsSync(inputPath)) return [];

        const text = fs.readFileSync(inputPath, "utf8");
        const fileName = path.basename(inputPath, ".md");
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

            sections.push({
                id: this.slugify(`${fileName}|${title}`),
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