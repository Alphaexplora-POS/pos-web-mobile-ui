import { toast } from 'sonner';
import { notifySessionExpired } from '../../features/auth/sessionExpiry';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

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

export const invalidateCache = (prefix: string): void => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};

/** Drop every cached GET response. Must run on login/logout so one user's
 * cached data can never surface inside another tenant's session. */
export const clearApiCache = (): void => {
  cache.clear();
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
  const res = await fetch(`${API_BASE}${path}`, {
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
    if (method !== 'GET') {
      toast.error(message);
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
