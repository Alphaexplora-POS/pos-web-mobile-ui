import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 6;

/**
 * Pack items into pages that are as full as possible within the given capacity:
 * fewer pages first, then the least amount of leftover space on the final page.
 * e.g. 10 items @ cap 6 -> 5+5 (never 6+4 with a half-empty page).
 */
const pickPageSize = (total: number, capacity: number): number => {
  if (total <= 0) return Math.max(1, capacity);
  if (total <= capacity) return capacity;
  let best = capacity;
  let bestScore = Infinity;
  for (let size = Math.min(capacity, total); size >= 2; size -= 1) {
    const totalPages = Math.ceil(total / size);
    const emptyOnLast = size - (total - (totalPages - 1) * size);
    const score = totalPages * 1_000_000 + emptyOnLast;
    if (score < bestScore) {
      bestScore = score;
      best = size;
    }
  }
  return best;
};

export const usePagination = <T,>(items: T[], pageSize = DEFAULT_PAGE_SIZE) => {
  const [page, setPage] = useState(1);
  const effectivePageSize = pickPageSize(items.length, pageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, items.length);

  useEffect(() => {
    setPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  return {
    page: currentPage,
    totalPages,
    totalCount: items.length,
    pageItems,
    pageStart: items.length === 0 ? 0 : startIndex + 1,
    pageEnd: endIndex,
    goToPage,
    next: () => goToPage(currentPage + 1),
    prev: () => goToPage(currentPage - 1),
  };
};