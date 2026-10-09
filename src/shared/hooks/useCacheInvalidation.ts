import { useEffect, useRef } from 'react';
import { onCacheInvalidation } from '../models/apiClient';

/** A prefix matches when either side contains the other, so callers can listen
 * for a broad resource (e.g. `GET /reference/reason-codes`) while mutations
 * invalidate a narrower or wider suffix. `'*'` means the whole cache dropped. */
const matches = (invalidated: string, prefix: string): boolean =>
  invalidated === '*' || invalidated.startsWith(prefix) || prefix.startsWith(invalidated);

/**
 * Re-run `handler` whenever a cached GET key matching any of `prefixes` is
 * invalidated (or when the whole cache is cleared). Lets a mounted view refresh
 * data that another feature just changed, without a manual page reload.
 */
export const useCacheInvalidation = (prefixes: string[], handler: () => void): void => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const key = prefixes.join('|');

  useEffect(() => {
    const unsubscribe = onCacheInvalidation((invalidated) => {
      if (prefixes.some((prefix) => matches(invalidated, prefix))) handlerRef.current();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
};
