import path from 'path';
import { Resource } from '../core/interfaces/Resource';
import { ResourceRegistry } from '../core/interfaces/ResourceRegistry';
import { ResourceLoader } from '../core/interfaces/ResourceLoader';
import { Logger } from '../core/interfaces/Logger';

export class InMemoryResourceRegistry implements ResourceRegistry {
    private map = new Map<string, Resource>();
    private baseDir: string;

    constructor(
        baseDir: string,
        private loader: ResourceLoader,
        private logger: Logger
    ) {
        this.baseDir = path.resolve(baseDir);
    }

    async reload(): Promise<void> {
        this.map.clear();
        const list = await this.loader.loadAll(this.baseDir);
        const stack: Resource[] = [...list];
        while (stack.length) {
            const r = stack.pop()!;
            this.map.set(r.id, r);
            for (const c of r.children) stack.push(c);
        }
        this.logger.info('Registry reloaded', { count: this.map.size });
    }

    getAll(): Resource[] {
        return Array.from(this.map.values());
    }

    getByPrefix(prefix: string): Resource[] {
        const p = prefix.toLowerCase();
        return Array.from(this.map.values()).filter(r => r.id.toLowerCase().startsWith(p + '|') || r.id.toLowerCase() === p);
    }

    getById(id: string): Resource | undefined {
        return this.map.get(id);
    }

    searchByPhrases(phrases: string[]): Resource[] {
        const res: Resource[] = [];
        const regs = phrases.map(ph => {
            const safe = ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`\\b${safe}\\b`, 'i');
        });
        for (const r of this.map.values()) {
            const hay = `${r.name}\n${r.description ?? ''}\n${r.whenToLoad ?? ''}`;
            if (regs.some(re => re.test(hay))) res.push(r);
        }
        return res;
    }
}