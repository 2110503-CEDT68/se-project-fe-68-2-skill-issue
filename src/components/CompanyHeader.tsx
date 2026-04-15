'use client';

import { useState } from 'react';
import { CompanyItem } from '../../interface';
import StarDisplay from './StarDisplay';

// ── CompanyLogo ──────────────────────────────────────────────────────────────
// Renders the company image, falling back to an emoji if the URL is absent
// or the image fails to load.
interface CompanyLogoProps {
  src?: string;
  name: string;
}

function CompanyLogo({ src, name }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return <span className="company-logo-placeholder">🏢</span>;
  }

  return (
    <img
      src={src}
      alt={name}
      className="company-img"
      onError={() => setImgError(true)}
    />
  );
}

// ── CompanyHeader ────────────────────────────────────────────────────────────

interface CompanyHeaderProps {
  company: CompanyItem;
  reviewCount: number;
  /** ID of the currently-logged-in user (empty string if not logged in) */
  currentUserId: string;
  /** true if the logged-in user already has a review for this company */
  hasUserReview: boolean;
  isFull:boolean;
  onOpenReviewModal: () => void;
  onOpenBookModal: () => void;
}

/**
 * Top section of the Company Profile page.
 * Displays the company logo (with image-error fallback), name, address,
 * description, star rating summary and action buttons.
 */
export default function CompanyHeader({
  company,
  reviewCount,
  currentUserId,
  hasUserReview,
  onOpenReviewModal,
  onOpenBookModal,
  isFull
}: CompanyHeaderProps) {
  const avgRating = company.averageRating ?? 0;

  return (
    <div className="company-header">
      {/* Logo */}
      <div className="company-logo-box">
        <CompanyLogo src={company.imgSrc} name={company.name} />
      </div>

      {/* Info */}
      <div className="company-header-info">
        <h1>{company.name}</h1>

        {company.address && (
          <p className="company-header-address">{company.address}</p>
        )}

        {company.description && (
          <p className="company-header-desc">{company.description}</p>
        )}

        {/* Rating summary */}
        <div className="company-rating-row">
          <StarDisplay rating={avgRating} />
          <span className="company-rating-text">
            <strong>{avgRating.toFixed(1)}/5.0</strong>
            {' '}({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Action buttons */}
        <div className="company-actions">
          {currentUserId && (
            <button className="btn-review-now" onClick={onOpenReviewModal}>
              {hasUserReview ? '✏️ Edit Review' : 'Reviews Now!'}
            </button>
          )}
          {isFull ? (
            <div className="btn-book-now" style={{ pointerEvents: 'none', opacity: 0.7 }}>Booking limit reached</div>
          ) : (
            <button className="btn-book-now" onClick={onOpenBookModal}>
            Book Now
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}
