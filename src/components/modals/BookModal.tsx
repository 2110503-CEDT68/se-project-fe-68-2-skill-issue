'use client';

import { CompanyItem } from '../../../interface';
import DateReserve from '@/components/booking/DateReserve';
import ModalWrapper from '../ModalWrapper';

interface BookModalProps {
  company:    CompanyItem;
  editMode:   boolean;
  date:       string;
  time:       string;
  submitting: boolean;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onConfirm: () => void;
  onClose:   () => void;
}

export default function BookModal({
  company, editMode, date, time, submitting,
  onDateChange, onTimeChange, onConfirm, onClose,
}: BookModalProps) {
  return (
    <ModalWrapper open onClose={onClose}>
      <div className="modal" style={{ maxWidth: 440, textAlign: 'left' }}>
        <h3>{editMode ? 'Edit Booking Date' : 'Confirm Booking'}</h3>
        <p className="modal-sub">
          {editMode
            ? `Update interview date for ${company.name}`
            : 'Choose your interview date and time.'}
        </p>

        {!editMode && (
          <div className="modal-detail">
            <div className="detail-row-book">
              <span>Company</span><span>{company.name}</span>
            </div>
            <div className="detail-row-book">
              <span>Address</span><span>{company.address}</span>
            </div>
            {company.website && (
              <div className="detail-row-book">
                <span>Website</span><span>{company.website}</span>
              </div>
            )}
            {company.telephone_number && (
              <div className="detail-row-book">
                <span>Tel.</span><span>{company.telephone_number}</span>
              </div>
            )}
          </div>
        )}

        <DateReserve
          date={date} time={time}
          onDateChange={onDateChange} onTimeChange={onTimeChange}
        />
        <p className="date-hint">Must be May 10–13, 2022 (09:00–17:00)</p>

        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-modal-confirm"
            style={{ background: editMode ? 'var(--text)' : undefined }}
            onClick={onConfirm}
            disabled={submitting}>
            {submitting
              ? (editMode ? <><span className="btn-spinner" />Saving…</> : <><span className="btn-spinner" />Booking…</>)
              : (editMode ? 'Save Changes' : 'Confirm Booking')}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}