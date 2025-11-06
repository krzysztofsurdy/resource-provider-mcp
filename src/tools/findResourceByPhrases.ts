import { ResourceRegistry } from '../core/interfaces/ResourceRegistry.js';
import { ImportanceResourceSorter } from '../services/ImportanceResourceSorter.js';
import { SimplePaginator } from '../services/SimplePaginator.js';
import { SimpleResourceFilter } from '../services/SimpleResourceFilter.js';

export class FindResourceByPhrasesTool {
  private readonly sorter = new ImportanceResourceSorter();
  private readonly paginator = new SimplePaginator();
  private readonly filter = new SimpleResourceFilter();
  private readonly DEFAULT_LIMIT = 15;
  private readonly DEFAULT_PAGE = 1;

  constructor(private readonly registry: ResourceRegistry) {}

  async execute(args: { phrases: string[]; limit?: number; page?: number }): Promise<string> {
    const limit = args.limit ?? this.DEFAULT_LIMIT;
    const page = args.page ?? this.DEFAULT_PAGE;
    const results = this.registry.searchByPhrases(args.phrases);

    const uniqueResults = this.filter.uniqueBy(results, 'id');

    const filteredResults = this.filter.filterBy(uniqueResults, (r) => {
      if (r.type === 'section') {
        return !!(r.description || r.whenToLoad || r.importance);
      }
      return true;
    });

    const sortedResults = this.sorter.sort(filteredResults);

    const paginationResult = this.paginator.paginate(sortedResults, page, limit);

    return JSON.stringify({
      resources: paginationResult.items.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        description: r.description ?? null,
        whenToLoad: r.whenToLoad ?? null,
        importance: r.importance ?? null,
      })),
      limit: paginationResult.limit,
      page: paginationResult.page,
      totalPages: paginationResult.totalPages,
      total: paginationResult.total,
    });
  }
}
