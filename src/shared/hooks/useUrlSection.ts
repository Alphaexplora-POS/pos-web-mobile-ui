import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlSection = <T extends string>(
  param: string,
  fallback: T,
  isAllowed: (value: string | null) => T | null,
): readonly [T, (next: T) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = isAllowed(searchParams.get(param)) ?? fallback;

  const set = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next === fallback) updated.delete(param);
          else updated.set(param, next);
          return updated;
        },
        { replace: true },
      );
    },
    [setSearchParams, param, fallback],
  );

  return [current, set] as const;
};