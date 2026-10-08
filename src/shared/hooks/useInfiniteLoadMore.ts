import { useEffect, useRef } from 'react';

export const useInfiniteLoadMore = (onReach: () => void, deps: unknown[] = []) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onReachRef = useRef(onReach);
  onReachRef.current = onReach;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onReachRef.current();
      },
      { rootMargin: '150px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { sentinelRef };
};