'use client';

import '@/styles/modal.css';
import ModalWrapper from '../ModalWrapper';

interface ConfirmModalProps {
  open: boolean;
  icon?: string;
  title: string;
  message: React.ReactNode;
  cancelText?: string;
  confirmText: string;
  loadingText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  open, icon = '🗑️', title, message,
  cancelText = 'Cancel', confirmText, loadingText,
  loading, onConfirm, onClose,
}: ConfirmModalProps) {
  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="modal-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn-modal-cancel" onClick={onClose}>{cancelText}</button>
        <button className="btn-modal-confirm" onClick={onConfirm} disabled={loading}>
          {loading ? (loadingText || 'Processing…') : confirmText}
        </button>
      </div>
    </ModalWrapper>
  );
}
