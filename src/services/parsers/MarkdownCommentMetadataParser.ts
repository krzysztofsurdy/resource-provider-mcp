import fs from "fs";
import { ResourceParser } from "../../core/interfaces/ResourceParser";
import { Resource } from "../../core/interfaces/Resource";

export class MarkdownCommentMetadataParser implements ResourceParser {
    private readonly BLOCK_RE = /<!--\s*([\s\S]*?)\s*-->/m;
    private readonly KV_RE = /^\s*([a-zA-Z][\w-]*?)\s*:\s*(.+?)\s*$/gm;

    async parse(inputPath: string): Promise<Resource[]> {
        if (!inputPath.endsWith(".md") || !fs.existsSync(inputPath)) return [];

        const text = fs.readFileSync(inputPath, "utf8");
        const m = text.match(this.BLOCK_RE);
        if (!m) return [];

        const meta: Partial<Resource> = this.parseMetadata(m[1]);
        const name = inputPath.split("/").pop()?.replace(/\.md$/, "") ?? "unknown";

        const resource: Resource = {
            id: this.slugify(name),
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
            if (key === "description") meta.description = val;
            else if (key === "whentoload") meta.whenToLoad = val;
            else if (key === "importance" || key === "priority") {
                if (["low", "mid", "high"].includes(val.toLowerCase()))
                    meta.importance = val.toLowerCase() as any;
            }
        }
        return meta;
    }

    private slugify(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }
}