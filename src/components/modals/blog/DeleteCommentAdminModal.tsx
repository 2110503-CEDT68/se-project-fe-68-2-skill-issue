'use client';

import { useState, useEffect, useRef } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import '@/styles/modal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const GRACE_SEC = 5;

export default function DeleteCommentAdminModal({ open, onClose, onConfirm, loading = false }: Props) {
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState(false);
  const [otherError, setOtherError] = useState(false);

  // countdown state
  const [countdown, setCountdown] = useState<number | null>(null); // null = not started
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset everything when modal opens
  useEffect(() => {
    if (open) {
      setReason('');
      setOtherText('');
      setError(false);
      setOtherError(false);
      setCountdown(null);
    }
  }, [open]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopTimers = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const handleConfirm = () => {
    if (!reason) { setError(true); return; }
    if (reason === 'other' && !otherText.trim()) { setOtherError(true); return; }

    // Start countdown
    setCountdown(GRACE_SEC);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      const finalReason = reason === 'other' ? `Other: ${otherText.trim()}` : reason;
      onConfirm(finalReason); // fire API
    }, GRACE_SEC * 1000);
  };

  const handleUndo = () => {
    stopTimers();
    setCountdown(null); // back to form state
  };

  const handleClose = () => {
    stopTimers();
    setCountdown(null);
    onClose();
  };

  const isCounting = countdown !== null;
  const progress = countdown !== null ? (countdown / GRACE_SEC) * 100 : 100;

  return (
    <ModalWrapper open={open} onClose={handleClose}>
      <div>
        <div className="modal-icon">🗑️</div>
        <h3>Delete Comment</h3>

        {/* ── Countdown view ── */}
        {isCounting ? (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: 16 }}>
              Deleting comment
            </p>

            {/* Circular countdown */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                {/* Progress */}
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              <span style={{
                position: 'absolute',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ef4444',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {countdown}
              </span>
            </div>

            <p style={{ marginTop: 12, fontSize: '0.8rem', color: '#888' }}>
              Press cancel to undo deletion
            </p>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-modal-cancel" onClick={handleUndo}>
                ↩ Cancel
              </button>
            </div>
          </div>

        ) : (
          /* ── Form view ── */
          <>
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
              <button className="btn-modal-cancel" onClick={handleClose}>Cancel</button>
              <button className="btn-confirm-delete" onClick={handleConfirm} disabled={loading}>
                <span className="btn-text-white">{loading ? 'Deleting...' : 'Yes, Delete it'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}