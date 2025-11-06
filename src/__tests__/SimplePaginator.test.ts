import { describe, it, expect } from '@jest/globals';
import { SimplePaginator } from '../services/SimplePaginator';

describe('SimplePaginator', () => {
  const paginator = new SimplePaginator();

  it('should paginate items correctly with first page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = paginator.paginate(items, 1, 3);

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(3);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(4);
  });

  it('should paginate items correctly with middle page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = paginator.paginate(items, 2, 3);

    expect(result.items).toEqual([4, 5, 6]);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(3);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(4);
  });

  it('should paginate items correctly with last page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = paginator.paginate(items, 4, 3);

    expect(result.items).toEqual([10]);
    expect(result.page).toBe(4);
    expect(result.limit).toBe(3);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(4);
  });

  it('should handle page beyond total pages', () => {
    const items = [1, 2, 3, 4, 5];
    const result = paginator.paginate(items, 10, 3);

    expect(result.items).toEqual([]);
    expect(result.page).toBe(10);
    expect(result.limit).toBe(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should handle limit larger than total items', () => {
    const items = [1, 2, 3];
    const result = paginator.paginate(items, 1, 10);

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  it('should handle empty array', () => {
    const items: number[] = [];
    const result = paginator.paginate(items, 1, 10);

    expect(result.items).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should handle single item', () => {
    const items = [42];
    const result = paginator.paginate(items, 1, 10);

    expect(result.items).toEqual([42]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('should handle exact division of items by limit', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = paginator.paginate(items, 2, 3);

    expect(result.items).toEqual([4, 5, 6]);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(3);
    expect(result.total).toBe(6);
    expect(result.totalPages).toBe(2);
  });

  it('should not mutate original array', () => {
    const items = [1, 2, 3, 4, 5];
    const originalItems = [...items];

    paginator.paginate(items, 2, 2);

    expect(items).toEqual(originalItems);
  });

  it('should work with different data types', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const result = paginator.paginate(items, 2, 2);

    expect(result.items).toEqual([{ id: 3 }, { id: 4 }]);
    expect(result.totalPages).toBe(2);
  });
});
