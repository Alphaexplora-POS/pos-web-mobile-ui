import { useLayoutEffect, useRef } from 'react';
import { useViewportFill } from '../hooks/useViewportFill';

interface ViewportTableProps {
  className?: string;
  children?: React.ReactNode;
  onFitHeightChange?: (height: number) => void;
  onRowHeightChange?: (height: number) => void;
}

const ViewportTable: React.FC<ViewportTableProps> = ({
  className = '',
  children,
  onFitHeightChange,
  onRowHeightChange,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const minHeight = useViewportFill(ref);

  useLayoutEffect(() => {
    if (typeof minHeight !== 'number' || minHeight <= 0) return;
    onFitHeightChange?.(minHeight);
  }, [minHeight, onFitHeightChange]);

  useLayoutEffect(() => {
    if (!onRowHeightChange) return;
    const row = ref.current?.querySelector<HTMLElement>('tbody tr');
    if (row) {
      const height = row.getBoundingClientRect().height;
      if (height > 0) onRowHeightChange(height);
    }
  });

  return (
    <div ref={ref} className={`flex flex-col ${className}`} style={{ minHeight }}>
      {children}
    </div>
  );
};

export default ViewportTable;