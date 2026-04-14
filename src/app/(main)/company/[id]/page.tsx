'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

import ReviewModal from '@/components/modals/ReviewModal';
import DeleteReviewModal from '@/components/modals/DeleteReviewModal';
import BookModal from '@/components/modals/BookModal';
import Toast from '@/components/Toast';

import getCompany   from '@/libs/getCompany';
import getBookings  from '@/libs/getBookings';
import getReviews   from '@/libs/getReviews';
import createReview from '@/libs/createReview';
import editReview from '@/libs/editReview';
import createBooking from '@/libs/createBooking';

import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/dateFormat';
import { CompanyItem, ReviewItem } from '../../../../../interface';

import '@/styles/companyProfile.css';
import '@/styles/review.css';
import '@/styles/modal.css';
import '@/styles/bookingList.css';
import '@/styles/card.css'

const PAGE_SIZE = 5;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill={filled ? '#E8A020' : 'none'}
      stroke={filled ? '#E8A020' : '#C4BDB8'} strokeWidth="1.8">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}



function StarDisplay({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'inline-flex', gap: 3 }}>
      {[1,2,3,4,5].map(s => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        const clipId = `half-${size}-${s}`;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="#C4BDB8" strokeWidth="1.8">
            {half && (
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width="12" height="24" />
                </clipPath>
              </defs>
            )}
            {/* empty star base */}
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            {/* filled overlay */}
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

//--ImageHandle
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

export default function CompanyProfilePage() {
  const params    = useParams();
  const companyId = params.id as string;

  const [company,     setCompany]     = useState<CompanyItem | null>(null);
  const [reviews,     setReviews]     = useState<ReviewItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingPage, setLoadingPage] = useState(true);

  const [currentUserId,   setCurrentUserId]   = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [userReview,      setUserReview]       = useState<ReviewItem | null>(null);
  const [userBookingDate, setUserBookingDate] = useState('');

  const [showModal,   setShowModal]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showBookModal,  setShowBookModal]  = useState(false);
  const [bookDate,       setBookDate]       = useState('2022-05-10');
  const [bookTime,       setBookTime]       = useState('09:00');
  const [bookSubmitting, setBookSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  // ── Load company
  const loadCompany = useCallback(async () => {
    try {
      const res = await getCompany(companyId);
      setCompany(res.data);
    } catch { /* ignore */ }
  }, [companyId]);

  // ── Load reviews
  const loadReviews = useCallback(async () => {
    try {
      const res = await getReviews(companyId);
      setReviews(res.data || []);
    } catch { /* ignore */ }
  }, [companyId]);

  // ── Init user + check if user has past booking
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u._id || '');
        setCurrentUserName(u.name || u.email || '');
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!currentUserId || !companyId) return;
    const token = localStorage.getItem('jf_token') || '';
    getBookings(token).then(res => {
      const booking = (res.data || []).find(b => {
        const cId = typeof b.company === 'object' ? b.company._id : b.company;
        return cId === companyId;
      });
      if (booking) {
        setUserBookingDate(formatDate(booking.bookingDate));
      }
    }).catch(() => {});
  }, [currentUserId, companyId]);

  // ── On reviews load, find user's review
  useEffect(() => {
    if (!currentUserId) return;
    const mine = reviews.find(r => {
      const uid = typeof r.user === 'object' ? r.user._id : r.user;
      return uid === currentUserId;
    });
    setUserReview(mine ?? null);
  }, [reviews, currentUserId]);

  // ── Initial load
  useEffect(() => {
    setLoadingPage(true);
    Promise.all([loadCompany(), loadReviews()]).finally(() => setLoadingPage(false));
  }, [loadCompany, loadReviews]);

  async function handleBookSubmit() {
    if (!company) return;
    setBookSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const newDate = `${bookDate}T${bookTime}:00`;
      await createBooking(token, companyId, newDate);
      showToast('✅ Booking confirmed!', 'success');
      setShowBookModal(false);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Booking failed'}`, 'error');
    } finally {
      setBookSubmitting(false);
    }
  }

  // ── Create or update review
  async function handleReviewSubmit(rating: number, comment: string) {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      if (userReview) {
      // ✏️ กรณีแก้ไข: ใช้ editReview lib
      await editReview(token, userReview._id, rating, comment);
      showToast('✅ Review updated!', 'success');
    } else {
      // 🆕 กรณีสร้างใหม่: ใช้ createReview lib
      await createReview(token, companyId, rating, comment);
      showToast('✅ Review published!', 'success');
    }
      await loadReviews();
      await loadCompany();
      setShowModal(false);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed to save review'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      // สมมติว่ามี lib deleteReview หรือใช้ fetch โดยตรง
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/reviews/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete review');

      showToast('✅ Review deleted', 'success');
      setDeleteTarget(null);
      // โหลดข้อมูลใหม่เพื่ออัปเดต Rating เฉลี่ยและรายการรีวิว
      await Promise.all([loadReviews(), loadCompany()]);
    } catch (err: any) {
      showToast(`❌ ${err.message || 'Error deleting review'}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }


  // ── Skeleton
  if (loadingPage) return (
    <div className="company-profile-page">
      <div className="company-header">
        <div className="company-logo-box" />
        <div style={{ flex: 1 }}>
          <div className="booking-skeleton" style={{ marginBottom: 12 }}>
            <div className="sk-line sk-wide" />
            <div className="sk-line sk-medium" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!company) return (
    <div className="company-profile-page">
      <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>Company not found.</p>
    </div>
  );

  const avgRating   = company.averageRating ?? 0;
  const numReviews  = company.numReviews ?? reviews.length;
  const myReview = reviews.find(r => {
  const uid = typeof r.user === 'object' ? r.user._id : r.user;
  return uid === currentUserId;
});

// สร้าง list ใหม่โดยเอาของตัวเองไว้หน้าสุด และลบของตัวเองออกจาก list เดิมเพื่อไม่ให้ซ้ำ
const otherReviews = reviews.filter(r => {
  const uid = typeof r.user === 'object' ? r.user._id : r.user;
  return uid !== currentUserId;
});

const sortedReviews = myReview ? [myReview, ...otherReviews] : otherReviews;
const visibleRevs = sortedReviews.slice(0, visibleCount);

  return (
    <div className="company-profile-page">

      {/* ── Company Header */}
      <div className="company-header">
       <div className="company-logo-box">
          <CompanyLogo src={company.imgSrc} name={company.name} />
        </div>

        <div className="company-header-info">
          <h1>{company.name}</h1>
          {company.address && <p className="company-header-address">{company.address}</p>}
          {company.description && <p className="company-header-desc">{company.description}</p>}

          {/* Rating */}
          <div className="company-rating-row">
            <StarDisplay rating={avgRating} />
            <span className="company-rating-text">
              <strong>{avgRating.toFixed(1)}/5.0</strong>
              {' '}({numReviews} {numReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {/* Action buttons */}
          <div className="company-actions">
            {currentUserId && (
              <button className="btn-review-now" onClick={() => setShowModal(true)}>
                {userReview ? '✏️ Edit Review' : 'Reviews Now!'}
              </button>
            )}
            <a href="/book-company" className="btn-book-now" onClick={(e) => { e.preventDefault(); setShowBookModal(true); }}>Book Now</a>
          </div>
        </div>
      </div>

      {/* ── Reviews Feed */}
      {reviews.length === 0 ? (
        <div className="no-reviews-placeholder">No Reviews Yet ...
        <h3>Be the first one to leave a review!!!!!</h3>
        </div>
      ) : (
        <>
          <div className="reviews-feed">
  {visibleRevs.map((review, idx) => {
    const userName = typeof review.user === 'object' ? review.user.name : 'User';
    const isOwner = typeof review.user === 'object'
      ? review.user._id === currentUserId
      : review.user === currentUserId;

    return (
      <div key={review._id} className="review-card" style={{ animationDelay: `${idx * 0.06}s` }}>
        <div className="review-card-top">
          <div className="review-card-meta">
            <span className="meta-tag meta-user">
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              {userName} {isOwner && "(You)"}
            </span>
            <span className="meta-tag">
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(review.createdAt)}
            </span>
          </div>

          <div className="review-card-rating-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div className="review-card-rating">
              <StarDisplay rating={review.rating} size={18} />
            </div>
            {isOwner && (
              <div className="review-owner-actions" style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-edit-date"
                  onClick={() => setShowModal(true)} 
                >
                  Edit
                </button>
                <button 
                  className="btn-cancel btn-delete-review"
                  onClick={() => setDeleteTarget(review)} 
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
  })}
</div>

          {visibleCount < reviews.length && (
            <button className="load-more-btn" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
              Loading More Comment...
            </button>
          )}
        </>
      )}

      {/* ── Review Modal */}
      {showModal && (
        <ReviewModal
          userName={currentUserName}
          bookingDate={userBookingDate}
          existingReview={userReview}
          submitting={submitting}
          onConfirm={handleReviewSubmit}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ── Delete Confirmation Modal (ลบ) */}
      {deleteTarget && (
        <DeleteReviewModal
          loading={deleteLoading}
          onConfirm={handleDeleteReview}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Book Modal */}
      {showBookModal && company && (
        <BookModal
          company={company}
          editMode={false}
          date={bookDate}
          time={bookTime}
          submitting={bookSubmitting}
          onDateChange={setBookDate}
          onTimeChange={setBookTime}
          onConfirm={handleBookSubmit}
          onClose={() => setShowBookModal(false)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
