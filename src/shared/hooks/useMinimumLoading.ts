import { useEffect, useRef, useState } from 'react';

export const useMinimumLoading = (isLoading: boolean, minMs: number = 500): boolean => {
  const [elapsed, setElapsed] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startRef.current = performance.now();
      setElapsed(false);
    } else if (startRef.current !== null) {
      const remaining = minMs - (performance.now() - startRef.current);
      const timer = setTimeout(() => setElapsed(true), Math.max(remaining, 0));
      return () => clearTimeout(timer);
    } else {
      setElapsed(true);
    }
  }, [isLoading, minMs]);

  return isLoading || !elapsed;
};