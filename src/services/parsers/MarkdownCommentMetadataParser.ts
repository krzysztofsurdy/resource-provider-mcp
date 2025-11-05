import fs from "fs";
import path from "path";
import { ResourceParser } from "../../core/interfaces/ResourceParser";
import { Resource } from "../../core/interfaces/Resource";
import { Importance } from "../../core/enum/Importance";

export class MarkdownCommentMetadataParser implements ResourceParser {
    private readonly BLOCK_RE = /<!--\s*([\s\S]*?)\s*-->/m;
    private readonly KV_RE = /^\s*([a-zA-Z][\w-]*?)\s*:\s*(.+?)\s*$/gm;
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

        const m = text.match(this.BLOCK_RE);
        if (!m) return [];

        const meta: Partial<Resource> = this.parseMetadata(m[1]);
        const name = path.basename(inputPath, ".md");
        const fileId = this.slugify(name);
        const fullId = contextPrefix ? `${contextPrefix}|${fileId}` : fileId;

        const resource: Resource = {
            id: fullId,
            name,
            type: "file",
            description: meta.description,
            whenToLoad: meta.whenToLoad,
            importance: meta.importance,
            children: [],
            content: text,
        };

        return [resource];
    }

    private parseMetadata(block: string): Partial<Resource> {
        const meta: Partial<Resource> = {};
        for (const line of block.split("\n")) {
            const kv = this.KV_RE.exec(line);
            this.KV_RE.lastIndex = 0;
            if (!kv) continue;
            const key = kv[1].trim().toLowerCase();
            const val = kv[2].trim();
            if (key === "description") {
                meta.description = val;
            } else if (key === "whentoload" || key === "whenload") {
                meta.whenToLoad = val;
            } else if (key === "importance" || key === "priority") {
                const normalizedVal = val.toLowerCase();
                if (this.isValidImportance(normalizedVal)) {
                    meta.importance = normalizedVal;
                }
            }
        }
        return meta;
    }

    private isValidImportance(value: string): value is Importance {
        return value === "low" || value === "mid" || value === "high";
    }

    private slugify(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }
}