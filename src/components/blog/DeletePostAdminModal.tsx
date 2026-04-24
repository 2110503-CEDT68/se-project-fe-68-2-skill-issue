'use client';

import { useState, useEffect } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import '@/styles/modal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export default function DeletePostAdminModal({ open, onClose, onConfirm, loading = false }: Props) {
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState(false);
  const [otherError, setOtherError] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setOtherText('');
      setError(false);
      setOtherError(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!reason) { setError(true); return; }
    if (reason === 'other' && !otherText.trim()) { setOtherError(true); return; }
    onConfirm(reason === 'other' ? `Other: ${otherText.trim()}` : reason);
  };

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div>
        <div className="modal-icon">🗑️</div>
        <h3>Delete Blog Post?</h3>
        <p className="modal-sub">Select a policy violation reason</p>

        <select
          required
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(false); }}
          className={`filter-select ${error ? 'error' : ''} ${!reason ? 'placeholder' : ''}`}
          style={{ width: '100%', marginTop: 12 }}
        >
          <option value="" disabled hidden>-- Select reason --</option>
          <option value="spam">Spam</option>
          <option value="offensive">Offensive Content</option>
          <option value="harassment">Harassment</option>
          <option value="misinformation">Misinformation</option>
          <option value="inappropriate">Inappropriate Content</option>
          <option value="other">Other</option>
        </select>

        {error && (
          <p style={{ color: 'red', fontSize: '0.85rem', marginTop: 6 }}>This field is required</p>
        )}

        {reason === 'other' && (
          <>
            <input
              type="text"
              className={`admin-date-input${otherError ? ' error' : ''}`}
              style={{ width: '100%', marginTop: 10, boxSizing: 'border-box' }}
              placeholder="Please specify..."
              value={otherText}
              maxLength={200}
              onChange={(e) => { setOtherText(e.target.value); setOtherError(false); }}
            />
            {otherError && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginTop: 6 }}>Please specify the reason</p>
            )}
          </>
        )}

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm-delete" onClick={handleConfirm} disabled={loading}>
            <span className="btn-text-white">{loading ? 'Deleting...' : 'Yes, Delete it'}</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}