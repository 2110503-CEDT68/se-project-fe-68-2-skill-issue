'use client';

import { BookingItem } from '../../../interface';
import DateReserve from '../DateReserve';
import ModalWrapper from '../ModalWrapper';

interface EditModalProps {
  target:   BookingItem;
  date:     string;
  time:     string;
  loading:  boolean;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onConfirm: () => void;
  onClose:   () => void;
}

export default function EditModal({
  target, date, time, loading,
  onDateChange, onTimeChange, onConfirm, onClose,
}: EditModalProps) {
  return (
    <ModalWrapper open onClose={onClose}>
      <div className="modal-icon" style={{ margin: '0 0 16px' }}>✏️</div>
      <h3>Edit Booking Date</h3>
      <p>Update interview date for <strong>{target.company?.name}</strong></p>
      <DateReserve
        date={date} time={time}
        onDateChange={onDateChange} onTimeChange={onTimeChange}
      />
      <p className="date-hint">Must be between May 10–13, 2022 (09:00–17:00)</p>
      <div className="modal-actions">
        <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-modal-confirm"
          style={{ background: 'var(--text)' }}
          onClick={onConfirm}
          disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </ModalWrapper>
  );
}