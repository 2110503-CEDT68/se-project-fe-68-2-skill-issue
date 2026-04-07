'use client';

import { CompanyItem, BookingItem } from '../../interface';
import { formatDate } from '../utils/dateFormat';

interface CompanyCardProps {
  company:  CompanyItem;
  booked?:  BookingItem;
  isFull:   boolean;
  index:    number;
  onBook:   (company: CompanyItem) => void;
  onEdit:   (company: CompanyItem) => void;
  onCancel: (booking: BookingItem) => void;
}

export default function CompanyCard({
  company, booked, isFull, index, onBook, onEdit, onCancel,
}: CompanyCardProps) {
  return (
    <div
      className={`company-card${booked ? ' is-booked' : ''}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="company-top">
        <div className="company-logo">🏢</div>
        <div>
          <div className="company-name">{company.name}</div>
          <div className="company-sub">{company.address}</div>
        </div>
      </div>

      {company.description && (
        <p className="company-desc">
          {company.description.length > 110
            ? company.description.slice(0, 110) + '...'
            : company.description}
        </p>
      )}

      <div className="company-footer">
        {booked ? (
          <div className="booked-footer">
            <span className="btn-booked">✓ {formatDate(booked.bookingDate)}</span>
            <div className="booked-actions">
              <button className="btn-edit-small" onClick={() => onEdit(company)}>
                ✏️ Edit
              </button>
              <button className="btn-cancel-small" onClick={() => onCancel(booked)}>
                Cancel
              </button>
            </div>
          </div>
        ) : isFull ? (
          <span className="btn-limit">Booking limit reached</span>
        ) : (
          <button className="btn-book" onClick={() => onBook(company)}>
            Book Now
          </button>
        )}
      </div>
    </div>
  );
}