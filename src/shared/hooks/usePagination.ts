import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 6;

/**
 * Page size is always the full visible capacity, so a page only spills onto a
 * new one once every slot is filled. Only the final page may be short.
 * e.g. 10 items @ cap 6 -> 6 + 4.
 */
const pickPageSize = (_total: number, capacity: number): number => Math.max(1, capacity);

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