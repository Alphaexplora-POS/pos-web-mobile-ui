import { useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 6;

export const usePagination = <T,>(items: T[], pageSize = DEFAULT_PAGE_SIZE) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);

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