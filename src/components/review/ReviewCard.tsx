import { ReviewItem } from '../../../interface';
import StarDisplay from './StarDisplay';
import { formatDate, getEffectiveDate } from '@/utils/dateFormat';

interface ReviewCardProps {
  review: ReviewItem;
  index: number;
  /** ID of the currently-logged-in user */
  currentUserId: string;
  currentUserRole?: string; 
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
  currentUserRole,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const userName = typeof review.user === 'object' ? review.user.name : review.user;
  const isOwner =
    typeof review.user === 'object'
      ? review.user._id === currentUserId
      : review.user === currentUserId;
  const displayDate = getEffectiveDate(review);
  const isAdmin= currentUserRole=='admin';
  return (
    <div
      className="review-card"
      style={{ 
        animationDelay: `${index * 0.06}s`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px'
      }}
    >
      {/* --- ฝั่งซ้าย: ข้อมูล User + วันที่ และ คอมเมนต์อยู่ด้านล่าง --- */}
      <div style={{ flex: 1 }}>
        <div className="review-card-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span className="meta-tag meta-user">
            <UserIcon />
            {userName} {isOwner && '(You)'}
          </span>
          <span className="meta-tag">
            <CalendarIcon />
            {formatDate(displayDate)}
            {review.edited && <span className="edited-badge">✏️ edited</span>}
          </span>
        </div>

        {/* คอมเมนต์อยู่ล่างชื่อผู้ใช้พอดี */}
        <p className="review-card-comment" style={{ marginTop: '12px', marginBottom: 0 }}>
          {review.comment}
        </p>
      </div>

      {/* --- ฝั่งขวา: ดาว และ ปุ่มจัดการ (Edit/Delete) อยู่ติดกันด้านบน --- */}
      <div
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end', 
          gap: '8px', 
          flexShrink: 0 
        }}
      >
        <div className="review-card-rating">
          <StarDisplay rating={review.rating} size={18} />
        </div>

        <div className="review-card-actions" style={{ display: 'flex', gap: '8px' }}>
          {/* เฉพาะเจ้าของถึงจะแก้ได้ */}
          {isOwner && (
            <button className="btn-review-edit" onClick={onEdit}>
              Edit
            </button>
          )}
          
          {/* เจ้าของ "หรือ" Admin ถึงจะลบได้ */}
          {(isOwner || isAdmin) && (
            <button
              className="btn-review-delete"
              onClick={() => onDelete(review)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}