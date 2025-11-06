import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';
import { Resource } from '../core/interfaces/Resource.js';
import { ImportanceResourceSorter } from '../services/ImportanceResourceSorter.js';
import { SimplePaginator } from '../services/SimplePaginator.js';
import { SimpleResourceFilter } from '../services/SimpleResourceFilter.js';

interface SerializedResource {
  id: string;
  name: string;
  type: string;
  description: string | null;
  whenToLoad: string | null;
  importance: string | null;
}

export class GetAvailableResourcesTool {
  private readonly sorter = new ImportanceResourceSorter();
  private readonly paginator = new SimplePaginator();
  private readonly filter = new SimpleResourceFilter();
  private readonly DEFAULT_LIMIT = 15;
  private readonly DEFAULT_PAGE = 1;

  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { prefix?: string; limit?: number; page?: number }): Promise<string> {
    const limit = args.limit ?? this.DEFAULT_LIMIT;
    const page = args.page ?? this.DEFAULT_PAGE;
    const flatItems = args.prefix ? this.registry.getByPrefix(args.prefix) : this.registry.getAll();

    const uniqueItems = this.filter.uniqueBy(flatItems, 'id');

    const filteredItems = this.filter.filterBy(uniqueItems, (r) => {
      if (r.type === 'section') {
        return !!(r.description || r.whenToLoad || r.importance);
      }
      return true;
    });

    const sortedItems = this.sorter.sort(filteredItems);

    const paginationResult = this.paginator.paginate(sortedItems, page, limit);

    return JSON.stringify({
      resources: paginationResult.items.map((r) => this.serializeResource(r)),
      limit: paginationResult.limit,
      page: paginationResult.page,
      totalPages: paginationResult.totalPages,
      total: paginationResult.total,
    });
  }

  private serializeResource(r: Resource): SerializedResource {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description ?? null,
      whenToLoad: r.whenToLoad ?? null,
      importance: r.importance ?? null,
    };
  }
}
