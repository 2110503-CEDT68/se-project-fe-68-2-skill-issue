'use client';

import Link from 'next/link';
import { CompanyItem, BookingItem } from '../../interface';
import { formatDate } from '../utils/dateFormat';
import { useState } from 'react';

function CompanyLogo({ src, name }: { src?: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) return <span>🏢</span>;
  return (
    <img
      src={src}
      alt={name}
      className="company-img"
      onError={() => setImgError(true)}
    />
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        const clipId = `cc-half-${s}`;
        return (
          <svg key={s} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C4BDB8" strokeWidth="1.8">
            {half && (
              <defs>
                <clipPath id={clipId}><rect x="0" y="0" width="12" height="24" /></clipPath>
              </defs>
            )}
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            {(full || half) && (
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill="#E8A020" stroke="#E8A020"
                clipPath={half ? `url(#${clipId})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

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
      {/* Clickable header → Company Profile */}
      <Link href={`/company/${company._id}`} className="company-top company-top-link">
        <div className="company-logo"><CompanyLogo src={company.imgSrc} name={company.name} /></div>
        <div>
          <div className="company-name">{company.name}</div>
          <div className="company-sub">{company.address}</div>
          {(company.averageRating !== undefined && company.averageRating > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <StarDisplay rating={company.averageRating} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {company.averageRating.toFixed(1)} ({company.numReviews ?? 0} {(company.numReviews ?? 0) === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
      </Link>

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
