'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { ReviewItem, BookingItem } from '../../interface';
import getReviews from '../libs/getReviews';
import deleteReview from '../libs/deleteReview';
import editReview from '../libs/editReview';
import createReview from '../libs/createReview';
import ReviewModal from './modals/ReviewModal';
import DeleteReviewModal from './modals/DeleteReviewModal';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import '@/styles/review.css';
import '@/styles/bookingList.css';

function StarMini({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        const clipId = `mrl-half-${s}`;
        return (
          <svg key={s} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C4BDB8" strokeWidth="1.8">
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

export default function MyReviewList() {
  const bookings = useSelector((state: RootState) => state.book.bookItems);

  const [reviewMap, setReviewMap] = useState<Record<string, ReviewItem | null>>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  const [editTarget, setEditTarget] = useState<{ booking: BookingItem; review: ReviewItem } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ booking: BookingItem; review: ReviewItem } | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast, showToast } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u._id || '');
        setCurrentUserName(u.name || '');
      }
    } catch { /* ignore */ }
  }, []);

  const loadReviews = useCallback(async () => {
    if (!currentUserId || bookings.length === 0) { setLoading(false); return; }
    setLoading(true);
    const uniqueCompanyIds = [...new Set(bookings.filter(b => b.company?._id).map(b => b.company._id))];
    await Promise.all(uniqueCompanyIds.map(async (companyId) => {
      try {
        const res = await getReviews(companyId);
        const mine = res.data?.find(r => {
          const uid = typeof r.user === 'object' ? r.user._id : r.user;
          return uid === currentUserId;
        }) ?? null;
        setReviewMap(prev => ({ ...prev, [companyId]: mine }));
      } catch {
        setReviewMap(prev => ({ ...prev, [companyId]: null }));
      }
    }));
    setLoading(false);
  }, [currentUserId, bookings]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  async function confirmEdit(rating: number, comment: string) {
    if (!editTarget) return;
    setReviewSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const res = await editReview(token, editTarget.review._id, rating, comment);
      const updated: ReviewItem = Array.isArray(res.data) ? res.data[0] : { ...editTarget.review, rating, comment };
      setReviewMap(prev => ({ ...prev, [editTarget.booking.company._id]: updated }));
      showToast('✅ Review updated!', 'success');
      setEditTarget(null);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deleteReview(token, deleteTarget.review._id);
      setReviewMap(prev => ({ ...prev, [deleteTarget.booking.company._id]: null }));
      showToast('✅ Review deleted.', 'success');
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  const reviewedBookings = bookings.filter(b => b.company?._id && reviewMap[b.company._id]);

  if (loading) return (
    <div className="bookings-list">
      {[0, 1].map(i => (
        <div key={i} className="booking-skeleton">
          <div className="sk-line sk-wide" />
          <div className="sk-line sk-medium" />
        </div>
      ))}
    </div>
  );

  if (reviewedBookings.length === 0) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
      You haven't reviewed any company yet.
    </p>
  );

  return (
    <>
      <div className="bookings-list">
        {reviewedBookings.map((booking, idx) => {
          const review = reviewMap[booking.company._id]!;
          return (
            <div key={booking._id} className="booking-card" style={{ animationDelay: `${idx * 0.07}s` }}>
              <div className="booking-card-left">
                <div className="booking-number">{idx + 1}</div>
                <div className="booking-info">
                  <span className="company-name-btn" style={{ cursor: 'default' }}>
                    {booking.company?.name || 'Unknown Company'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <StarMini rating={review.rating} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E8A020' }}>
                      {review.rating}/5
                    </span>
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: 4 }}>
                    "{review.comment}"
                  </p>
                </div>
              </div>
              <div className="booking-actions">
                <button className="btn-edit-date" onClick={() => setEditTarget({ booking, review })}>✏️ Edit</button>
                <button className="btn-cancel btn-delete-review" onClick={() => setDeleteTarget({ booking, review })}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {editTarget && (
        <ReviewModal
          userName={currentUserName}
          bookingDate={editTarget.booking.bookingDate}
          existingReview={editTarget.review}
          submitting={reviewSubmitting}
          onConfirm={confirmEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteReviewModal
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
