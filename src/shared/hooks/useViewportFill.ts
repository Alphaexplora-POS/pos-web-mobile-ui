import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

const BOTTOM_MARGIN_PX = 48;
const MIN_HEIGHT_PX = 140;

export const useViewportFill = (ref: RefObject<HTMLElement | null>) => {
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const available = window.innerHeight - top - BOTTOM_MARGIN_PX;
      setMinHeight(Math.max(MIN_HEIGHT_PX, Math.round(available)));
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    const ro = new ResizeObserver(schedule);
    if (ref.current) ro.observe(ref.current);
    const t = setTimeout(schedule, 300);
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) schedule();
    });

    return () => {
      cancelled = true;
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('load', schedule);
      ro.disconnect();
    };
  }, [ref]);

  return minHeight;
};