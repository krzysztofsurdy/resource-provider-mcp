export interface PaginationResult<T> {
  items: T[];
  limit: number;
  page: number;
  totalPages: number;
  total: number;
}

export interface Paginator {
  paginate<T>(items: T[], page: number, limit: number): PaginationResult<T>;
}
