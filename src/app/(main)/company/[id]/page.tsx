'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── Components ───────────────────────────────────────────────────────────────
import CompanyHeader          from '@/components/CompanyHeader';
import CompanyProfileSkeleton from '@/components/Companyprofileskeleton';
import ReviewsFeed            from '@/components/ReviewsFeed';
import CreateReviewModal      from '@/components/modals/CreateReviewModal';
import EditReviewModal        from '@/components/modals/EditReviewModal';
import DeleteReviewModal      from '@/components/modals/DeleteReviewModal';
import DeleteReviewAdminModal from '@/components/modals/DeleteReviewAdminModal';
import BookModal              from '@/components/modals/BookModal';
import Toast                  from '@/components/Toast';

// ── Libs / hooks ─────────────────────────────────────────────────────────────
import getCompany   from '@/libs/getCompany';
import getBookings  from '@/libs/getBookings';
import createBooking from '@/libs/createBooking';

import { useReviews }  from '@/hooks/useReviews';
import { useToast }    from '@/hooks/useToast';
import { formatDate }  from '@/utils/dateFormat';
import { CompanyItem, ReviewItem } from '../../../../../interface';

// ── Styles ───────────────────────────────────────────────────────────────────
import '@/styles/companyProfile.css';
import '@/styles/review.css';
import '@/styles/modal.css';
import '@/styles/bookingList.css';
import '@/styles/card.css';

export default function CompanyProfilePage({ isFull }: { isFull: boolean }) {
  const params    = useParams();
  const companyId = params.id as string;

  // ── Data state ────────────────────────────────────────────────────────────
  const [company, setCompany] = useState<CompanyItem | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  // ── Auth / user state ─────────────────────────────────────────────────────
  const [userInfo, setUserInfo] = useState({ id: '', name: '', role: '' });
  const [userBookingDate, setUserBookingDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Book modal state ──────────────────────────────────────────────────────
  const [showBookModal, setShowBookModal]   = useState(false);
  const [bookDate, setBookDate]             = useState('2022-05-10');
  const [bookTime, setBookTime]             = useState('09:00');
  const [bookSubmitting, setBookSubmitting] = useState(false);

  // ── ใช้ความสามารถจาก Custom Hook ──
  const {
    reviews,
    setReviews,
    fetchReviews,
    handleCreate,
    handleUpdate,
    handleConfirmDelete,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    isSubmitting
  } = useReviews();

  const { toast, showToast } = useToast();

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadCompany = useCallback(async () => {
    try {
      const res = await getCompany(companyId);
      setCompany(res.data);
    } catch { /* ignore */ }
  }, [companyId]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUserInfo({ id: u._id || '', name: u.name || '', role: u.role || '' });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!userInfo.id || !companyId) return;
    const token = localStorage.getItem('jf_token') || '';
    getBookings(token)
      .then((res) => {
        const booking = (res.data || []).find((b: any) => {
          const cId = typeof b.company === 'object' ? b.company._id : b.company;
          return cId === companyId;
        });
        if (booking) setUserBookingDate(formatDate(booking.bookingDate));
      })
      .catch(() => {});
  }, [userInfo.id, companyId]);

  useEffect(() => {
    setLoadingPage(true);
    Promise.all([loadCompany(), fetchReviews(companyId)]).finally(() => setLoadingPage(false));
  }, [loadCompany, fetchReviews, companyId]);

  // หา Review ของตัวเองจากรายการทั้งหมด
  const userReview = reviews.find((r) => {
    const uid = typeof r.user === 'object' ? r.user._id : r.user;
    return uid === userInfo.id;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function onBookSubmit() {
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

  // Admin delete logic (เสริมจาก Hook)
  const handleAdminDelete = async (reason: string) => {
    const success = await handleConfirmDelete();
    if (success) {
      showToast(`✅ Deleted by admin. Reason: ${reason}`, 'success');
      await loadCompany(); // update counter
    }
  };

  if (loadingPage) return <CompanyProfileSkeleton />;

  if (!company) return (
    <div className="company-profile-page">
      <p style={{ textAlign: 'center', padding: '60px 0' }}>Company not found.</p>
    </div>
  );

  const isDeletingOwn = (typeof deleteTarget?.user === 'object' ? deleteTarget.user._id : deleteTarget?.user) === userInfo.id;

  return (
    <div className="company-profile-page">
      <CompanyHeader
        company={company}
        reviewCount={company.numReviews ?? reviews.length}
        currentUserId={userInfo.id}
        hasUserReview={!!userReview}
        isFull={isFull}
        onOpenReviewModal={() => userReview ? setEditTarget(userReview) : setShowCreateModal(true)}
        onOpenBookModal={() => setShowBookModal(true)}
      />

      <ReviewsFeed
        reviews={reviews}
        currentUserId={userInfo.id}
        currentUserRole={userInfo.role}
        onEditReview={(review) => setEditTarget(review)}
        onDeleteReview={(review) => setDeleteTarget(review)}
      />

      {/* ── 1. Create Modal ── */}
      {showCreateModal && (
        <CreateReviewModal
          userName={userInfo.name}
          companyName={company.name}
          submitting={isSubmitting}
          bookingDate={formatDate(new Date().toISOString())}
          onConfirm={async (rating, comment) => {
            const success = await handleCreate(companyId, rating, comment);
            if (success) {
              setShowCreateModal(false);
              loadCompany(); // refresh header stats
            }
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* ── 2. Edit Modal ── */}
      {editTarget && (
        <EditReviewModal
          userName={userInfo.name}
          bookingDate={formatDate(editTarget.effectiveDate)}
          existingReview={editTarget}
          submitting={isSubmitting}
          onConfirm={async (rating, comment) => {
            await handleUpdate(rating, comment);
            // hook จะจัดการ update reviews state ให้เอง
          }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <>
          {/* กรณีลบของตัวเอง (ไม่ว่าจะเป็น User หรือ Admin) */}
          {((typeof deleteTarget.user === 'object' ? deleteTarget.user._id : deleteTarget.user) === userInfo.id) ? (
            <DeleteReviewModal
              loading={isSubmitting}
              onConfirm={handleConfirmDelete}
              onClose={() => setDeleteTarget(null)}
            />
          ) : (
            userInfo.role === 'admin' && (
              <DeleteReviewAdminModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleAdminDelete} // ส่งเหตุผลการลบ
                loading={isSubmitting}
              />
            )
          )}
        </>
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
          onConfirm={onBookSubmit}
          onClose={() => setShowBookModal(false)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}