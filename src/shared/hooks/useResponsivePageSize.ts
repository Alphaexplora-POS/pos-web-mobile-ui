import { useEffect, useLayoutEffect, useState } from 'react';

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

const CARD_HEIGHT_PX = 96 + 12; // min-h-24 card + space-y-3 gap
const CARD_CHROME_PX = 56; // pagination bar inside the card container
const MIN_CARDS = 2;
const MAX_CARDS = 9;

const computeCards = (height: number, cardHeightPx: number) =>
  Math.min(MAX_CARDS, Math.max(MIN_CARDS, Math.floor((height - CARD_CHROME_PX) / cardHeightPx)));

/** Page size for card lists so pages fill every visible row before creating a new one. */
export const useResponsiveCardPageSize = (
  containerHeight = 0,
  cardHeightPx = CARD_HEIGHT_PX,
): number => {
  const [pageSize, setPageSize] = useState<number>(() =>
    typeof window === 'undefined' ? 5 : computeCards(window.innerHeight - VIEWPORT_CHROME_PX, cardHeightPx),
  );

  useLayoutEffect(() => {
    if (containerHeight > 0) {
      setPageSize(computeCards(containerHeight, cardHeightPx));
      return;
    }
    const onResize = () =>
      setPageSize(computeCards(window.innerHeight - VIEWPORT_CHROME_PX, cardHeightPx));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [containerHeight, cardHeightPx]);

  return pageSize;
};