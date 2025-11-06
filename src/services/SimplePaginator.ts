import { Paginator, PaginationResult } from '../core/interfaces/Paginator';

export class SimplePaginator implements Paginator {
  paginate<T>(items: T[], page: number, limit: number): PaginationResult<T> {
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      limit,
      page,
      totalPages,
      total,
    };
  }
}
