import fs from "fs";
import path from "path";
import { ResourceParser } from "../../core/interfaces/ResourceParser";
import { Resource } from "../../core/interfaces/Resource";

export class JsonResourceMetadataParser implements ResourceParser {
    static FILENAME = "resource.json";

    async parse(inputPath: string): Promise<Resource[]> {
        const filePath = path.join(inputPath, JsonResourceMetadataParser.FILENAME);
        if (!fs.existsSync(filePath)) return [];

        try {
            const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const name = path.basename(inputPath);
            const resource: Resource = {
                id: this.slugify(name),
                name,
                type: "context",
                description: raw.description,
                whenToLoad: raw.whenToLoad,
                importance: raw.importance,
                children: [],
                content: null,
            };
            return [resource];
        } catch {
            return [];
        }
    }

    private slugify(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }
}