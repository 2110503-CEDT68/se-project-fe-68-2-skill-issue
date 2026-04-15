import { useState } from 'react';
import { ReviewItem } from '../../interface';
import ReviewCard from './ReviewCard';
import { getEffectiveDate } from '@/utils/dateFormat';

const PAGE_SIZE = 5;

interface ReviewsFeedProps {
  reviews: ReviewItem[];
  /** ID of the currently-logged-in user */
  currentUserId: string;
  currentUserRole: string,
  onEditReview: () => void;
  onDeleteReview: (review: ReviewItem) => void;
}

/**
 * Renders the full reviews section:
 * - Empty state when there are no reviews
 * - The logged-in user's review is always pinned to the top
 * - Paginated list of ReviewCard items
 * - "Load More" button
 */
export default function ReviewsFeed({
  reviews,
  currentUserId,
  currentUserRole,
  onEditReview,
  onDeleteReview,
}: ReviewsFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (reviews.length === 0) {
    return (
      <div className="no-reviews-placeholder">
        No Reviews Yet ...
        <h3>Be the first one to leave a review!!!!!</h3>
      </div>
    );
  }

  // Pin the current user's review to the top; sort rest by effectiveDate desc
  const myReview = reviews.find((r) => {
    const uid = typeof r.user === 'object' ? r.user._id : r.user;
    return uid === currentUserId;
  });
  const otherReviews = reviews
    .filter((r) => {
      const uid = typeof r.user === 'object' ? r.user._id : r.user;
      return uid !== currentUserId;
    })
    .sort((a, b) => {
      const tA = new Date(getEffectiveDate(a)).getTime();
      const tB = new Date(getEffectiveDate(b)).getTime();
      return tB - tA; // newest effective date first
    });
  const sortedReviews = myReview ? [myReview, ...otherReviews] : otherReviews;
  const visibleReviews = sortedReviews.slice(0, visibleCount);

  return (
    <>
      <div className="reviews-feed">
        {visibleReviews.map((review, idx) => (
          <ReviewCard
            key={review._id}
            review={review}
            index={idx}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onEdit={onEditReview}
            onDelete={onDeleteReview}
          />
        ))}
      </div>

      {visibleCount < reviews.length && (
        <button
          className="load-more-btn"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          Loading More Comment...
        </button>
      )}
    </>
  );
}
