'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── Components ───────────────────────────────────────────────────────────────
import CompanyHeader          from '@/components/CompanyHeader';
import CompanyProfileSkeleton from '@/components/Companyprofileskeleton';
import ReviewsFeed            from '@/components/review/ReviewsFeed';
import CreateReviewModal      from '@/components/modals/review/CreateReviewModal';
import EditReviewModal        from '@/components/modals/review/EditReviewModal';
import DeleteReviewModal      from '@/components/modals/review/DeleteReviewModal';
import DeleteReviewAdminModal from '@/components/modals/review/DeleteReviewAdminModal';
import BookModal              from '@/components/modals/BookModal';
import Toast                  from '@/components/Toast';

// ── Libs / hooks ─────────────────────────────────────────────────────────────
import getCompany   from '@/libs/getCompany';
import getBookings  from '@/libs/getBookings';
import createBooking from '@/libs/createBooking';

import { useReviews }     from '@/hooks/useReviews';
import { useBookCompany } from '@/hooks/useBookCompany';
import { useToast }       from '@/hooks/useToast';
import { formatDate }     from '@/utils/dateFormat';
import { CompanyItem }    from '../../../../../interface';

// ── Styles ───────────────────────────────────────────────────────────────────
import '@/styles/companyProfile.css';
import '@/styles/review.css';
import '@/styles/modal.css';
import '@/styles/bookingList.css';
import '@/styles/card.css';

export default function CompanyProfilePage() {
  const params    = useParams();
  const companyId = params.id as string;

  // ── Data state ────────────────────────────────────────────────────────────
  const [company, setCompany] = useState<CompanyItem | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [userInfo, setUserInfo] = useState({ id: '', name: '', role: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSubmitting, setBookSubmitting] = useState(false);

  // ── Hooks ──
  const { toast, showToast } = useToast();
  
  const {
    reviews,
    fetchReviews,
    handleCreate,
    handleUpdate,
    handleConfirmDelete,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    isSubmitting: reviewSubmitting
  } = useReviews(showToast);

  const {
    isFull,
    bookingMap,
    loadData, // ใช้สำหรับรีเฟรชสถานะการจอง (isFull)
    bookDate, setBookDate,
    bookTime, setBookTime
  } = useBookCompany();

  const isAlreadyBooked = !!bookingMap[companyId];

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
    setLoadingPage(true);
    // โหลดข้อมูลบริษัท, รีวิว และสถานะการจองล่าสุดพร้อมกัน
    Promise.all([
      loadCompany(), 
      fetchReviews(companyId), 
      loadData()
    ]).finally(() => setLoadingPage(false));
  }, [loadCompany, fetchReviews, loadData, companyId]);

  // หา Review ของตัวเอง
  const userReview = reviews.find((r) => {
    const uid = typeof r.user === 'object' ? r.user._id : r.user;
    return uid === userInfo.id;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  // ฟังก์ชันจอง (ปรับปรุงให้เรียก loadData เพื่อรีเฟรช isFull)
  async function handleBookSubmit() {
    if (!company) return;
    setBookSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const newDate = `${bookDate}T${bookTime}:00`;
      
      // 1. ยิง API สร้างการจอง
      await createBooking(token, companyId, newDate);
      
      // 2. 🔥 สำคัญ: สั่งให้ Hook โหลดข้อมูลใหม่เพื่ออัปเดตค่า isFull ในทันที
      await loadData(); 
      
      // 3. รีเฟรชข้อมูลบริษัท (เผื่อมี counter หรือสถานะอื่นๆ)
      await loadCompany();

      showToast('✅ Booking confirmed!', 'success');
      setShowBookModal(false);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Booking failed'}`, 'error');
    } finally {
      setBookSubmitting(false);
    }
  }

  const handleOpenBookModal = async () => {
    await loadData(); // เช็คสถานะล่าสุดก่อนเปิด Modal
    setShowBookModal(true);
  };

  const handleAdminDelete = async (reason: string) => {
    const success = await handleConfirmDelete();
    if (success) {
      showToast(`✅ Deleted by admin. Reason: ${reason}`, 'success');
      await loadCompany();
    }
  };

  if (loadingPage) return <CompanyProfileSkeleton />;

  if (!company) return (
    <div className="company-profile-page">
      <p style={{ textAlign: 'center', padding: '60px 0' }}>Company not found.</p>
    </div>
  );

  return (
    <div className="company-profile-page">
      <CompanyHeader
        company={company}
        reviewCount={company.numReviews ?? reviews.length}
        currentUserId={userInfo.id}
        hasUserReview={!!userReview}
        isFull={isFull} // ค่านี้จะกลายเป็น true ทันทีหลังจบ loadData() ใน handleBookSubmit
        isAlreadyBooked={isAlreadyBooked}
        onOpenReviewModal={() => userReview ? setEditTarget(userReview) : setShowCreateModal(true)}
        onOpenBookModal={handleOpenBookModal}
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
          submitting={reviewSubmitting}
          bookingDate={formatDate(new Date().toISOString())}
          onConfirm={async (rating, comment) => {
            const success = await handleCreate(companyId, rating, comment);
            if (success) {
              setShowCreateModal(false);
              loadCompany(); 
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
          submitting={reviewSubmitting}
          onConfirm={async (rating, comment) => {
            const success = await handleUpdate(rating, comment);
             if (success) {
              loadCompany(); 
            }
          }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* ── 3. Delete Modal ── */}
      {deleteTarget && (
        <>
          {((typeof deleteTarget.user === 'object' ? deleteTarget.user._id : deleteTarget.user) === userInfo.id) ? (
            <DeleteReviewModal
              loading={reviewSubmitting}
              onConfirm={
                async () => {
                const success = await handleConfirmDelete();
                if (success) {
                loadCompany(); 
                }
              }
              }
              onClose={() => setDeleteTarget(null)}
            />
          ) : (
            userInfo.role === 'admin' && (
              <DeleteReviewAdminModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleAdminDelete}
                loading={reviewSubmitting}
              />
            )
          )}
        </>
      )}

      {/* ── 4. Book Modal ── */}
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