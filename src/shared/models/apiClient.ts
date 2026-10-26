import { notifySessionExpired } from '../../features/auth/sessionExpiry';
import { API_BASE_URL } from './apiConfig';

interface ApiErrorResponse {
  message?: string;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 60_000;

export const getCache = <T>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
};

export const setCache = (key: string, value: unknown, ttlMs = CACHE_TTL_MS): void => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

type CacheInvalidationListener = (prefix: string) => void;
const invalidationListeners = new Set<CacheInvalidationListener>();

const emitInvalidation = (prefix: string): void => {
  for (const listener of invalidationListeners) listener(prefix);
};

/**
 * Subscribe to cache invalidations so dependent data can refetch itself. The
 * handler receives the normalized cache-key prefix that was invalidated, or
 * `'*'` when the entire cache is dropped (login/logout). Returns unsubscribe.
 */
export const onCacheInvalidation = (listener: (prefix: string) => void): (() => void) => {
  invalidationListeners.add(listener);
  return () => {
    invalidationListeners.delete(listener);
  };
};

export const invalidateCache = (prefix: string): void => {
  const normalized = prefix.startsWith('GET ') ? prefix : `GET ${prefix}`;
  for (const key of cache.keys()) {
    if (key.startsWith(normalized) || key.startsWith(prefix)) cache.delete(key);
  }
  emitInvalidation(normalized);
};

/** Drop every cached GET response. Must run on login/logout so one user's
 * cached data can never surface inside another tenant's session. */
export const clearApiCache = (): void => {
  cache.clear();
  emitInvalidation('*');
};

export const unwrapData = <T>(data: unknown): T => {
  if (data && typeof data === 'object' && 'data' in data && typeof (data as { data: unknown }).data === 'object') {
    return (data as { data: T }).data;
  }
  return data as T;
};

export interface ApiRequestOptions extends Omit<RequestInit, 'cache'> {
  cache?: boolean;
  cacheTtlMs?: number;
}

const RETRYABLE_503 = 503;
const RETRY_COOLDOWN_MS = 2_000;

class RetryableError extends Error {}

const parseAsJson = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const doFetch = async <T>(path: string, init: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
  });
  const data = await parseAsJson(res);
  if (!res.ok) {
    const payload = data as ApiErrorResponse | undefined;
    const message =
      typeof payload?.message === 'string' && payload.message
        ? payload.message
        : typeof data === 'string' && data
          ? data
          : 'Request failed';
    if (res.status === 401) {
      notifySessionExpired();
      throw new Error(message);
    }
    const method = init?.method ?? 'GET';
    if (res.status === RETRYABLE_503 && method === 'GET') {
      throw new RetryableError(message);
    }
    throw new Error(message);
  }
  return unwrapData<T>(data ?? {});
};

export const apiRequest = async <T>(path: string, init?: ApiRequestOptions): Promise<T> => {
  const { cache: useCache = false, cacheTtlMs, ...rest } = init ?? {};
  const cacheKey = useCache && (rest.method ?? 'GET') === 'GET' ? `GET ${path}` : null;
  const cached = cacheKey ? getCache<T>(cacheKey) : undefined;
  if (cached !== undefined) return cached;

  try {
    const value = await doFetch<T>(path, rest);
    if (cacheKey !== null) setCache(cacheKey, value, cacheTtlMs);
    return value;
  } catch (err) {
    if (!(err instanceof RetryableError)) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_COOLDOWN_MS));
    const value = await doFetch<T>(path, rest);
    if (cacheKey !== null) setCache(cacheKey, value, cacheTtlMs);
    return value;
  }
};
