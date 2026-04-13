'use client';

import ModalWrapper from '../ModalWrapper';
import '@/styles/modal.css';

interface DeleteReviewModalProps {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteReviewModal({ loading, onConfirm, onClose }: DeleteReviewModalProps) {
  return (
    <ModalWrapper open onClose={onClose}>
      <div className="delete-review-popup">
        <div className="modal-icon">🗑️</div>

        {/* Delete Review? */}
        <h2 className="delete-title">Delete Review?</h2>

        {/* Description */}
        <p className="delete-desc">
          Are you sure you want to delete your review?<br />
          This action cannot be undone.
        </p>

        {/* div.modal-actions */}
        <div className="delete-modal-actions">
          <button className="btn-cancel-light" onClick={onClose} disabled={loading}>
            <span className="btn-text-tapa">Keep it</span>
          </button>
          
          <button className="btn-confirm-delete" onClick={onConfirm} disabled={loading}>
            <span className="btn-text-white">{loading ? 'Deleting...' : 'Yes, Delete it'}</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}