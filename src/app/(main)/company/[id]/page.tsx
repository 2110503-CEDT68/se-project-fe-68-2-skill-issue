'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── Components ───────────────────────────────────────────────────────────────
import CompanyHeader          from '@/components/CompanyHeader';
import CompanyProfileSkeleton from '@/components/Companyprofileskeleton';
import ReviewsFeed            from '@/components/ReviewsFeed';
import ReviewModal            from '@/components/modals/ReviewModal';
import DeleteReviewModal      from '@/components/modals/DeleteReviewModal';
import BookModal              from '@/components/modals/BookModal';
import Toast                  from '@/components/Toast';

// ── Libs / hooks ─────────────────────────────────────────────────────────────
import getCompany   from '@/libs/getCompany';
import getBookings  from '@/libs/getBookings';
import getReviews   from '@/libs/getReviews';
import createReview from '@/libs/createReview';
import editReview   from '@/libs/editReview';
import createBooking from '@/libs/createBooking';
import deleteReview  from '@/libs/deleteReview';

import { useToast }    from '@/hooks/useToast';
import { formatDate }  from '@/utils/dateFormat';
import { CompanyItem, ReviewItem } from '../../../../../interface';

// ── Styles ───────────────────────────────────────────────────────────────────
import '@/styles/companyProfile.css';
import '@/styles/review.css';
import '@/styles/modal.css';
import '@/styles/bookingList.css';
import '@/styles/card.css';

// ─────────────────────────────────────────────────────────────────────────────

export default function CompanyProfilePage() {
  const params    = useParams();
  const companyId = params.id as string;

  // ── Data state ────────────────────────────────────────────────────────────
  const [company,     setCompany]     = useState<CompanyItem | null>(null);
  const [reviews,     setReviews]     = useState<ReviewItem[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // ── Auth / user state ─────────────────────────────────────────────────────
  const [currentUserId,   setCurrentUserId]   = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [userReview,      setUserReview]       = useState<ReviewItem | null>(null);
  const [userBookingDate, setUserBookingDate] = useState('');

  // ── Review modal state ────────────────────────────────────────────────────
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [deleteTarget,    setDeleteTarget]    = useState<ReviewItem | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  // ── Book modal state ──────────────────────────────────────────────────────
  const [showBookModal,  setShowBookModal]  = useState(false);
  const [bookDate,       setBookDate]       = useState('2022-05-10');
  const [bookTime,       setBookTime]       = useState('09:00');
  const [bookSubmitting, setBookSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadCompany = useCallback(async () => {
    try {
      const res = await getCompany(companyId);
      setCompany(res.data);
    } catch { /* ignore */ }
  }, [companyId]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await getReviews(companyId);
      setReviews(res.data || []);
    } catch { /* ignore */ }
  }, [companyId]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Resolve current user from localStorage
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

  // Check if the logged-in user has an existing booking for this company
  useEffect(() => {
    if (!currentUserId || !companyId) return;
    const token = localStorage.getItem('jf_token') || '';
    getBookings(token)
      .then((res) => {
        const booking = (res.data || []).find((b) => {
          const cId = typeof b.company === 'object' ? b.company._id : b.company;
          return cId === companyId;
        });
        if (booking) setUserBookingDate(formatDate(booking.bookingDate));
      })
      .catch(() => {});
  }, [currentUserId, companyId]);

  // Keep userReview in sync whenever reviews or currentUserId changes
  useEffect(() => {
    if (!currentUserId) return;
    const mine = reviews.find((r) => {
      const uid = typeof r.user === 'object' ? r.user._id : r.user;
      return uid === currentUserId;
    });
    setUserReview(mine ?? null);
  }, [reviews, currentUserId]);

  // Initial data load
  useEffect(() => {
    setLoadingPage(true);
    Promise.all([loadCompany(), loadReviews()]).finally(() => setLoadingPage(false));
  }, [loadCompany, loadReviews]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleBookSubmit() {
    if (!company) return;
    setBookSubmitting(true);
    try {
      const token  = localStorage.getItem('jf_token') || '';
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

  async function handleReviewSubmit(rating: number, comment: string) {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      if (userReview) {
        await editReview(token, userReview._id, rating, comment);
        showToast('✅ Review updated!', 'success');
      } else {
        await createReview(token, companyId, rating, comment);
        showToast('✅ Review published!', 'success');
      }
      await Promise.all([loadReviews(), loadCompany()]);
      setShowReviewModal(false);
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
      await deleteReview(token, deleteTarget._id);
      showToast('✅ Review deleted', 'success');
      setDeleteTarget(null);
      await Promise.all([loadReviews(), loadCompany()]);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? (err as Error).message : 'Error deleting review'}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingPage) return <CompanyProfileSkeleton />;

  if (!company) return (
    <div className="company-profile-page">
      <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
        Company not found.
      </p>
    </div>
  );

  const numReviews = company.numReviews ?? reviews.length;

  return (
    <div className="company-profile-page">

      {/* ── Company Header ── */}
      <CompanyHeader
        company={company}
        reviewCount={numReviews}
        currentUserId={currentUserId}
        hasUserReview={!!userReview}
        onOpenReviewModal={() => setShowReviewModal(true)}
        onOpenBookModal={() => setShowBookModal(true)}
      />

      {/* ── Reviews Feed ── */}
      <ReviewsFeed
        reviews={reviews}
        currentUserId={currentUserId}
        onEditReview={() => setShowReviewModal(true)}
        onDeleteReview={(review) => setDeleteTarget(review)}
      />

      {/* ── Modals ── */}
      {showReviewModal && (
        <ReviewModal
          userName={currentUserName}
          bookingDate={userBookingDate}
          existingReview={userReview}
          submitting={submitting}
          onConfirm={handleReviewSubmit}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {deleteTarget && (
        <DeleteReviewModal
          loading={deleteLoading}
          onConfirm={handleDeleteReview}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showBookModal && (
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
