'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReviewItem } from '../../interface';
import getCompanies from '../libs/getCompanies';
import EditReviewModal from './modals/EditReviewModal';
import DeleteReviewModal from './modals/DeleteReviewModal';
import Toast from './Toast';
import { useReviews } from '../hooks/useReviews';
import { useToast } from '../hooks/useToast';
import { formatDate, getEffectiveDate } from '@/utils/dateFormat';

function StarMini({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => {
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

type MyReviewDisplay = { companyId: string; companyName: string; review: ReviewItem };

export default function MyReviewList() {
  const [displayReviews, setDisplayReviews] = useState<MyReviewDisplay[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ id: '', name: '' });
  const { toast, showToast } = useToast();

  const {
    fetchReviews,
    handleUpdate,
    handleConfirmDelete,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    isSubmitting
  } = useReviews(showToast);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUserInfo({ id: u._id || '', name: u.name || '' });
      }
    } catch { /* ignore */ }
  }, []);

  const loadAllMyReviews = useCallback(async () => {
    if (!userInfo.id) { setLocalLoading(false); return; }
    setLocalLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const companiesRes = await getCompanies(token);
      const companies = companiesRes.data || [];
      const results: MyReviewDisplay[] = [];

      await Promise.all(companies.map(async (company) => {
        try {
          // fetchReviews ต้อง return ReviewItem[] (แก้ใน useReviews.ts แล้ว)
          const reviewsData = await fetchReviews(company._id); 
          const mine = reviewsData?.find((r: ReviewItem) => {
            const uid = typeof r.user === 'object' ? r.user._id : r.user;
            return uid === userInfo.id;
          });
          if (mine) {
            results.push({ companyId: company._id, companyName: company.name, review: mine });
          }
        } catch { /* skip */ }
      }));

      setDisplayReviews(results);
    } catch { /* ignore */ } finally {
      setLocalLoading(false);
    }
  }, [userInfo.id, fetchReviews]);

  useEffect(() => { loadAllMyReviews(); }, [loadAllMyReviews]);

  // UI สำหรับ Loading State
  if (localLoading) return (
    <div className="bookings-list">
      {[0, 1].map(i => (
        <div key={i} className="booking-skeleton">
          <div className="sk-line sk-wide" />
          <div className="sk-line sk-medium" />
        </div>
      ))}
      <Toast toast={toast} />
    </div>
  );

  return (
    <>
      {displayReviews.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
          You haven't reviewed any company yet.
        </p>
      ) : (
        <div className="bookings-list">
          {displayReviews.map((item, idx) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.76rem', color: 'var(--muted)' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(item.review.effectiveDate)}
                    {item.review.edited && <span className="edited-badge">✏️ edited</span>}
                  </div>
                </div>
              </div>
              <div className="booking-actions">
                <button className="btn-edit-date" onClick={() => setEditTarget(item.review)}>✏️ Edit</button>
                <button className="btn-cancel btn-delete-review" onClick={() => setDeleteTarget(item.review)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editTarget && (
        <EditReviewModal
          userName={userInfo.name}
          bookingDate={formatDate(editTarget.effectiveDate)}
          existingReview={editTarget}
          submitting={isSubmitting}
          onConfirm={async (rating, comment) => {
            const success = await handleUpdate(rating, comment);
            if (success) {
            setDisplayReviews(prev => prev.map(r => 
              r.review._id === editTarget._id 
                ? { 
                    ...r, 
                    review: { 
                      ...r.review, 
                      rating, 
                      comment, 
                      edited: true,
                      effectiveDate: new Date().toISOString() 
                    } 
                  } 
                : r
            ));
          }
          }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteReviewModal
          loading={isSubmitting}
          onConfirm={async () => {
            const success = await handleConfirmDelete();
            if (success) {
              setDisplayReviews(prev => prev.filter(r => r.review._id !== deleteTarget._id));
            }
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      <Toast toast={toast} />
    </>
  );
}