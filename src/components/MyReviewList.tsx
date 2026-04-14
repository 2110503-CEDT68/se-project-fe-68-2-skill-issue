'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReviewItem } from '../../interface';
import getReviews from '../libs/getReviews';
import getCompanies from '../libs/getCompanies';
import deleteReview from '../libs/deleteReview';
import editReview from '../libs/editReview';
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

type MyReview = { companyId: string; companyName: string; review: ReviewItem };

export default function MyReviewList() {
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  const [editTarget, setEditTarget] = useState<MyReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyReview | null>(null);
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
    if (!currentUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const companiesRes = await getCompanies(token);
      const companies = companiesRes.data || [];
      const results: MyReview[] = [];
      await Promise.all(companies.map(async (company) => {
        try {
          const res = await getReviews(company._id);
          const mine = res.data?.find(r => {
            const uid = typeof r.user === 'object' ? r.user._id : r.user;
            return uid === currentUserId;
          });
          if (mine) results.push({ companyId: company._id, companyName: company.name, review: mine });
        } catch { /* skip */ }
      }));
      setMyReviews(results);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  async function confirmEdit(rating: number, comment: string) {
    if (!editTarget) return;
    setReviewSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const res = await editReview(token, editTarget.review._id, rating, comment);
      const updated: ReviewItem = Array.isArray(res.data) ? res.data[0] : { ...editTarget.review, rating, comment };
      setMyReviews(prev => prev.map(r => r.companyId === editTarget.companyId ? { ...r, review: updated } : r));
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
      setMyReviews(prev => prev.filter(r => r.companyId !== deleteTarget.companyId));
      showToast('✅ Review deleted.', 'success');
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

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

  if (myReviews.length === 0) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
      You haven't reviewed any company yet.
    </p>
  );

  return (
    <>
      <div className="bookings-list">
        {myReviews.map((item, idx) => (
          <div key={item.companyId} className="booking-card" style={{ animationDelay: `${idx * 0.07}s` }}>
            <div className="booking-card-left">
              <div className="booking-number">{idx + 1}</div>
              <div className="booking-info">
                <span className="company-name-btn" style={{ cursor: 'default' }}>
                  {item.companyName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <StarMini rating={item.review.rating} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E8A020' }}>
                    {item.review.rating}/5
                  </span>
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: 4 }}>
                  "{item.review.comment}"
                </p>
              </div>
            </div>
            <div className="booking-actions">
              <button className="btn-edit-date" onClick={() => setEditTarget(item)}>✏️ Edit</button>
              <button className="btn-cancel btn-delete-review" onClick={() => setDeleteTarget(item)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editTarget && (
        <ReviewModal
          userName={currentUserName}
          bookingDate=""
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
