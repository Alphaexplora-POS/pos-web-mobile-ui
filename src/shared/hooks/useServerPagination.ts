import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../models/queryClient';

export const SERVER_PAGE_SIZE = 10;

export interface ServerPage<T> {
  items: T[];
  total: number;
}

export const toServerPage = <T>(payload: unknown, itemsKey: string): ServerPage<T> => {
  const p = (payload ?? {}) as Record<string, unknown>;
  const pagination = (p.pagination ?? {}) as Record<string, unknown>;
  const items = (p[itemsKey] ?? []) as T[];
  const total = Number(pagination.total ?? pagination.totalCount ?? items.length);
  return { items, total };
};

interface UseServerPaginationOptions {
  fetchSize?: number;
  deps?: unknown[];
  queryKey?: string[];
  refetchInterval?: number | false;
}

export const useServerPagination = <T,>(
  fetcher: (fetchPage: number) => Promise<ServerPage<T>>,
  viewSize: number,
  options: UseServerPaginationOptions = {},
) => {
  const { fetchSize = SERVER_PAGE_SIZE, deps = [], queryKey = [], refetchInterval = false } = options;

  const [offset, setOffset] = useState(0);
  const lastChunkData = useRef<ServerPage<T> | null>(null);
  const settledOffsetRef = useRef(0);
  const prevDepsRef = useRef<unknown[]>(deps);

  const chunk = Math.floor(offset / fetchSize);

  const query = useQuery<ServerPage<T>>({
    queryKey: [...queryKey, 'page', chunk],
    queryFn: () => fetcher(chunk + 1),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval,
    placeholderData: () => lastChunkData.current ?? undefined,
  });

  const data = query.data;
  const isPlaceholder = query.isPlaceholderData;

  useEffect(() => {
    if (data && !isPlaceholder) lastChunkData.current = data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isPlaceholder, chunk]);

  if (!isPlaceholder) settledOffsetRef.current = offset;

  useEffect(() => {
    const prev = prevDepsRef.current;
    const changed = prev.length !== deps.length || deps.some((v, i) => !Object.is(v, prev[i]));
    prevDepsRef.current = deps;
    if (changed) setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const size = Math.max(1, viewSize);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const clampedPage = (p: number) => Math.max(1, Math.min(totalPages, p));

  const displayOffset = isPlaceholder ? settledOffsetRef.current : offset;
  const displayChunk = Math.floor(displayOffset / fetchSize);
  const buffer = data?.items ?? [];
  const localStart = Math.max(0, displayOffset - displayChunk * fetchSize);
  const items = buffer.slice(localStart, localStart + size);

  const goToOffset = useCallback(
    (nextOffset: number) => {
      if (total <= 0) return;
      setOffset(Math.max(0, Math.min(total - 1, nextOffset)));
    },
    [total],
  );

  useEffect(() => {
    if (total > 0 && offset >= total) {
      const lastChunkStart = Math.max(0, total - 1);
      goToOffset(Math.floor(lastChunkStart / size) * size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const error = query.isError ? (query.error instanceof Error ? query.error.message : 'Failed to load') : null;

  return {
    items,
    page: clampedPage(Math.floor(displayOffset / size) + 1),
    totalPages,
    totalCount: total,
    pageStart: total === 0 ? 0 : displayOffset + 1,
    pageEnd: Math.min(total, displayOffset + size),
    loading: query.isLoading,
    error,
    goToPage: (p: number) => goToOffset((clampedPage(p) - 1) * size),
    next: () => goToOffset(displayOffset + size),
    prev: () => goToOffset(displayOffset - size),
    reset: () => {
      void queryClient.invalidateQueries({ queryKey: [...queryKey] });
      setOffset(0);
    },
    refetch: () => void query.refetch(),
  };
};