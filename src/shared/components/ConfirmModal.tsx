import { useState } from 'react';
import Modal from './Modal';
import LoadingButton from './LoadingButton';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, confirmLabel = 'Confirm', onConfirm, onClose }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} size="sm" onClose={onClose}>
      <p className="text-sm text-ink-secondary mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={submitting}
          className="px-4 py-2 rounded border border-line text-ink-secondary hover:bg-canvas disabled:opacity-50"
          onClick={onClose}
        >
          Cancel
        </button>
        <LoadingButton type="button" loading={submitting} loadingLabel="Saving…" onClick={handleConfirm}>
          {confirmLabel}
        </LoadingButton>
      </div>
    </Modal>
  );
};

export default ConfirmModal;