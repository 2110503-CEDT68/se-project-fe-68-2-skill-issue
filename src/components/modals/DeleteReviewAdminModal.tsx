'use client';

import ModalWrapper from '../ModalWrapper';
import '@/styles/modal.css';


import { useState, useEffect } from 'react';
interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export default function DeleteReviewAdminModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
  if (open) {
    setReason('');
    setError(false);
  }
}, [open]);

  const handleConfirm = () => {
    if (!reason) {
      setError(true);
      return;
    }
    onConfirm(reason);
  };

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="delete-review-popup" >
        <div className="modal-icon">🗑️</div>
        <h3>Delete Review</h3>
        <p className="modal-sub">
          Select a policy violation reason
        </p>

        <select
         required
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(false);
          }}
          className={`filter-select ${error ? 'error' : ''} ${!reason ? 'placeholder' : ''}`}
          style={{ width: '100%', marginTop: 12 }}
        >
          <option value="" disabled hidden className='placehd' >-- Select reason --</option>
          <option value="spam">Spam</option>
          <option value="offensive">Offensive Content</option>
          <option value="harassment">Harassment</option>
          <option value="fake">Fake Review</option>
          <option value="other">Other</option>
        </select>

        {error && (
          <p style={{ color: 'red', fontSize: '0.85rem', marginTop: 6 }}>
            This field is required
          </p>
        )}

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>

          <button
          
            className="btn-confirm-delete"
            onClick={handleConfirm}
            disabled={loading}
          >
            <span className="btn-text-white">{loading ? 'Deleting...' : 'Yes, Delete it'}</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}