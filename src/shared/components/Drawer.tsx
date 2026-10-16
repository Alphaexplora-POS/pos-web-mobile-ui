import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export const CLOSE_ALL_MODALS_EVENT = 'pos:close-all-modals';

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

const Drawer: React.FC<DrawerProps> = ({ title, onClose, children, width = 'max-w-md' }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onCloseAll = () => onClose();
    window.addEventListener(CLOSE_ALL_MODALS_EVENT, onCloseAll);
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener(CLOSE_ALL_MODALS_EVENT, onCloseAll);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
      <motion.div
        className={`absolute top-0 right-0 h-full bg-white shadow-2xl w-full ${width} flex flex-col`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-ink-primary">{title}</h2>
          <button
            className="text-ink-muted hover:text-ink-secondary text-2xl leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </motion.div>
    </div>
  );
};

export default Drawer;