'use client';

import { useRouter } from 'next/navigation';
import { CardProps } from '../../interface';
import { formatDate } from '../utils/dateFormat';
import '@/styles/card.css';

function StarMini({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        const clipId = `card-half-${s}`;
        return (
          <svg key={s} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#C4BDB8" strokeWidth="1.8">
            {half && <defs><clipPath id={clipId}><rect x="0" y="0" width="12" height="24" /></clipPath></defs>}
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            {(full || half) && (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill="#E8A020" stroke="#E8A020" clipPath={half ? `url(#${clipId})` : undefined} />
            )}
          </svg>
        );
      })}
    </span>
  );
}

export default function Card({ booking, index, onEdit, onCancel, onDetail, onDeleteReview, onEditReview, onReviewCompany, userReview }: CardProps) {
  const company = booking.company;
  const website = company?.website || '';
  const websiteHref = website
    ? website.startsWith('http') ? website : `https://${website}`
    : '#';

  const isPast = booking.bookingDate ? new Date(booking.bookingDate) < new Date() : false;

  return (
    <div className="booking-card" style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="booking-card-left">
        <div className="booking-number">{index + 1}</div>
        <div className="booking-info">

          <button className="company-name-btn" onClick={() => onDetail(booking)}>
            {company?.name || 'Unknown Company'}
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>

          <div className="booking-meta">
            {booking.user?.name && (
              <span className="meta-tag meta-user">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {booking.user.name}
              </span>
            )}

            <button className="meta-tag meta-date" onClick={() => !isPast && onEdit(booking)}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(booking.bookingDate)}
              {!isPast && <span className="edit-hint">✏️</span>}
            </button>

            {company?.address && (
              <span className="meta-tag">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {company.address}
              </span>
            )}

            {website && (
              <span className="meta-tag">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z" />
                </svg>
                <a href={websiteHref} target="_blank" rel="noopener noreferrer">{website}</a>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="booking-actions">
        {!isPast ? (
          <>
            <button className="btn-edit-date" onClick={() => onEdit(booking)}>✏️ Edit Date</button>
            <button className="btn-cancel"    onClick={() => onCancel(booking)}>Cancel</button>
          </>
        ) : userReview ? (
          <>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-edit-date" onClick={() => onEditReview?.(booking, userReview)}>✏️ Edit Review</button>
              <button className="btn-cancel btn-delete-review"
                onClick={() => onDeleteReview?.(booking, userReview)}>Delete Review</button>
            </div>
          </>
        ) : (
          <button className="btn-review-company" onClick={() => onReviewCompany?.(booking)}>Review Company</button>
        )}
      </div>
    </div>
  );
}
