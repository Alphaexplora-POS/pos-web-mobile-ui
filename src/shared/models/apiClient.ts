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

export const apiRequest = async <T>(path: string, init?: ApiRequestOptions): Promise<T> => {
  const { cache: useCache = false, cacheTtlMs, ...rest } = init ?? {};
  const cacheKey = useCache && (rest.method ?? 'GET') === 'GET' ? `GET ${path}` : null;
  const cached = cacheKey ? getCache<T>(cacheKey) : undefined;
  if (cached !== undefined) return cached;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...rest,
    headers:
      rest?.body instanceof FormData
        ? rest?.headers
        : {
            'Content-Type': 'application/json',
            ...rest?.headers,
          },
  });
  const data = await res.json();
  if (!res.ok) {
    const payload = data as ApiErrorResponse;
    const message = payload.message ?? 'Request failed';
    if (res.status === 401) {
      notifySessionExpired();
      throw new Error(message);
    }
    const method = rest?.method ?? 'GET';
    if (method !== 'GET') {
      toast.error(message);
    }
    throw new Error(message);
  }
  const value = unwrapData<T>(data);
  if (cacheKey !== null) setCache(cacheKey, value, cacheTtlMs);
  return value;
};
