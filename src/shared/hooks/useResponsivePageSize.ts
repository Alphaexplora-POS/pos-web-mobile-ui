import { useEffect, useState } from 'react';

const ROW_FALLBACK_PX = 56;
const TABLE_CHROME_PX = 96;
const MIN_ROWS = 3;
const MAX_ROWS = 7;
const VIEWPORT_CHROME_PX = 340;

const clampRows = (n: number) => Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(n)));

const computeFromHeight = (height: number, rowHeight: number) =>
  clampRows((height - TABLE_CHROME_PX) / (rowHeight > 0 ? rowHeight : ROW_FALLBACK_PX));

const computeFromViewport = () =>
  clampRows((window.innerHeight - VIEWPORT_CHROME_PX) / ROW_FALLBACK_PX);

export const useResponsivePageSize = (tableHeight = 0, rowHeight = 0): number => {
  const [pageSize, setPageSize] = useState<number>(() =>
    typeof window === 'undefined' ? 5 : computeFromViewport(),
  );

  useEffect(() => {
    if (tableHeight > 0) {
      setPageSize(computeFromHeight(tableHeight, rowHeight));
      return;
    }
    const onResize = () => setPageSize(computeFromViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [tableHeight, rowHeight]);

  return pageSize;
};