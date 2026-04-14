import { ReviewItem } from '../../interface';
import StarDisplay from './StarDisplay';
import { formatDate } from '@/utils/dateFormat';

interface ReviewCardProps {
  review: ReviewItem;
  index: number;
  /** ID of the currently-logged-in user */
  currentUserId: string;
  onEdit: () => void;
  onDelete: (review: ReviewItem) => void;
}

/** Icon helpers — kept local so the component is self-contained */
function UserIcon() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/**
 * Single review card.
 * Shows user name, date, star rating, comment and (for the owner) Edit / Delete buttons.
 */
export default function ReviewCard({
  review,
  index,
  currentUserId,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const userName = typeof review.user === 'object' ? review.user.name : 'User';
  const isOwner =
    typeof review.user === 'object'
      ? review.user._id === currentUserId
      : review.user === currentUserId;
  console.log(formatDate(review.editedAt || review.createdAt));
  return (
    <div
      className="review-card"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="review-card-top">
        {/* Left: user + date meta */}
        <div className="review-card-meta">
          <span className="meta-tag meta-user">
            <UserIcon />
            {userName} {isOwner && '(You)'}
          </span>
          <span className="meta-tag">
            <CalendarIcon />
            {formatDate(review.edited ? review.editedAt: review.createdAt)}
          </span>
        </div>

        {/* Right: stars + owner actions */}
        <div
          className="review-card-rating-container"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
        >
          <div className="review-card-rating">
            <StarDisplay rating={review.rating} size={18} />
          </div>

          {isOwner && (
            <div
              className="review-owner-actions"
              style={{ marginTop: '8px', display: 'flex', gap: '12px' }}
            >
              <button className="btn-edit-date" onClick={onEdit}>
                Edit
              </button>
              <button
                className="btn-cancel btn-delete-review"
                onClick={() => onDelete(review)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="review-card-comment">{review.comment}</p>
    </div>
  );
}