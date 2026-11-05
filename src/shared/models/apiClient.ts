import { toast } from 'sonner';
import { notifySessionExpired } from '../../features/auth/sessionExpiry';
import { API_BASE_URL as API_BASE } from './apiConfig';

interface ApiErrorResponse {
  message?: string;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
let cacheGeneration = 0;

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

export const clearApiCache = (): void => {
  cacheGeneration += 1;
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

const doFetch = async <T>(path: string, init: RequestInit, generation: number): Promise<T> => {
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
        : 'The API request failed (HTTP ' + res.status + '). Please try again.';
    if (res.status === 401) {
      if (generation === cacheGeneration) notifySessionExpired();
      throw new Error(message);
    }
    const method = init?.method ?? 'GET';
    if (res.status === RETRYABLE_503 && method === 'GET') {
      throw new RetryableError(message);
    }
    if (method !== 'GET' && generation === cacheGeneration) {
      toast.error(message);
    }
    throw new Error(message);
  }
  if (res.status !== 204 && res.status !== 205 && (!data || typeof data !== 'object')) {
    throw new Error('The API returned an unexpected response. Please try again.');
  }
  return unwrapData<T>(data ?? {});
};

export const apiRequest = async <T>(path: string, init?: ApiRequestOptions): Promise<T> => {
  const generation = cacheGeneration;
  const { cache: useCache = false, cacheTtlMs, ...rest } = init ?? {};
  const cacheKey = useCache && (rest.method ?? 'GET') === 'GET' ? `GET ${path}` : null;
  const cached = cacheKey ? getCache<T>(cacheKey) : undefined;
  if (cached !== undefined) return cached;

  try {
    const value = await doFetch<T>(path, rest, generation);
    if (cacheKey !== null && generation === cacheGeneration) setCache(cacheKey, value, cacheTtlMs);
    return value;
  } catch (err) {
    if (!(err instanceof RetryableError) || generation !== cacheGeneration) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_COOLDOWN_MS));
    if (generation !== cacheGeneration) throw new Error('The session changed. Please try again.');
    const value = await doFetch<T>(path, rest, generation);
    if (cacheKey !== null && generation === cacheGeneration) setCache(cacheKey, value, cacheTtlMs);
    return value;
  }
};
