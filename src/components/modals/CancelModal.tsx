'use client';

import { BookingItem } from '../../../interface';
import ModalWrapper from '../ModalWrapper';

interface CancelModalProps {
  target:    BookingItem;
  loading:   boolean;
  onConfirm: () => void;
  onClose:   () => void;
}

export default function CancelModal({ target, loading, onConfirm, onClose }: CancelModalProps) {
  return (
    <ModalWrapper open onClose={onClose}>
      <div className="modal-icon">🗑️</div>
      <h3>Cancel Booking?</h3>
      <p>
        Are you sure you want to cancel your booking with{' '}
        <strong style={{ color: 'var(--text)' }}>{target.company?.name}</strong>?
        <br />
        <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
          This action cannot be undone.
        </span>
      </p>
      <div className="modal-actions">
        <button className="btn-modal-cancel" onClick={onClose}>Keep It</button>
        <button className="btn-modal-confirm" onClick={onConfirm} disabled={loading}>
          {loading ? 'Cancelling…' : 'Yes, Cancel It'}
        </button>
      </div>
    </ModalWrapper>
  );
}