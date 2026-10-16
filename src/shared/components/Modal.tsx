import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export const CLOSE_ALL_MODALS_EVENT = 'pos:close-all-modals';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  animate?: boolean;
  size?: 'md' | 'sm' | 'lg' | 'xl' | '2xl';
  expanded?: boolean;
  fit?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, animate = true, size = 'md', expanded = false, fit = false }) => {
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
      <motion.div
        className={`relative bg-white rounded-lg shadow-xl w-full flex flex-col max-h-[90vh] ${fit ? 'h-[80vh]' : ''} ${
          size === 'sm'
            ? 'max-w-sm'
            : size === 'lg'
              ? expanded
                ? 'max-w-4xl'
                : 'max-w-2xl'
              : size === 'xl'
                ? 'max-w-5xl'
                : size === '2xl'
                  ? 'max-w-6xl'
                  : 'max-w-lg'
        }`}
        initial={animate ? { y: -24 } : false}
        animate={{ y: 0 }}
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
        <div className={`p-6 ${fit ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'overflow-y-auto'}`}>{children}</div>
      </motion.div>
    </div>,
    document.body,
  );
};

export default Modal;