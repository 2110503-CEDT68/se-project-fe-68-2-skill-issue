'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Card        from './Card';
import EditModal   from './modals/EditModal';
import CancelModal from './modals/CancelModal';
import DetailModal from './modals/DetailModal';
import EmptyState  from './EmptyState';
import Toast       from './Toast';

import getBookings   from '../libs/getBookings';
import updateBooking from '../libs/updateBooking';
import deleteBooking from '../libs/deleteBooking';
import getReviews    from '../libs/getReviews';

import { setBookings, removeBooking, updateBookingDate } from '../redux/features/bookSlice';
import { RootState } from '../redux/store';
import { BookingItem, ReviewItem } from '../../interface';
import { formatDate } from '../utils/dateFormat';
import { useToast } from '../hooks/useToast';

import '@/styles/bookingList.css';

export default function BookingList({ items }: { items?: BookingItem[] }) {
  const dispatch = useDispatch();
  const reduxBookings = useSelector((state: RootState) => state.book.bookItems);
  const bookings = items ?? reduxBookings;

  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const { toast, showToast }              = useToast();
  const [editTarget,    setEditTarget]    = useState<BookingItem | null>(null);
  const [cancelTarget,  setCancelTarget]  = useState<BookingItem | null>(null);
  const [detailTarget,  setDetailTarget]  = useState<BookingItem | null>(null);
  const [editDate,      setEditDate]      = useState('2022-05-10');
  const [editTime,      setEditTime]      = useState('09:00');
  const [editLoading,   setEditLoading]   = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Review state: companyId → ReviewItem | null
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewItem | null>>({});
  const [deleteReviewTarget, setDeleteReviewTarget] = useState<{ booking: BookingItem; review: ReviewItem } | null>(null);
  const [deleteReviewLoading, setDeleteReviewLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jf_token') || '';
      const res   = await getBookings(token);
      dispatch(setBookings(res.data || []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // ── After bookings load, fetch reviews for past bookings
  useEffect(() => {
    if (loading || bookings.length === 0) return;

    const userId = (() => {
      try { return JSON.parse(localStorage.getItem('jf_user') || '{}')._id || ''; }
      catch { return ''; }
    })();
    if (!userId) return;

    const pastBookings = bookings.filter(b => b.bookingDate && new Date(b.bookingDate) < new Date());
    const uniqueCompanyIds = [...new Set(pastBookings.map(b => b.company._id))];

    uniqueCompanyIds.forEach(async (companyId) => {
      try {
        const res = await getReviews(companyId);
        const userReview = res.data?.find(r => {
          const uid = typeof r.user === 'object' ? r.user._id : r.user;
          return uid === userId;
        }) ?? null;
        setReviewMap(prev => ({ ...prev, [companyId]: userReview }));
      } catch {
        setReviewMap(prev => ({ ...prev, [companyId]: null }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function openEditModal(booking: BookingItem) {
    setEditTarget(booking);
    const iso = booking.bookingDate || '';
    setEditDate(iso.slice(0, 10) || '2022-05-10');
    setEditTime(iso.length > 10 ? iso.slice(11, 16) : '09:00');
  }

  async function confirmEdit() {
    if (!editTarget) return;
    const [y, m, d] = editDate.split('-').map(Number);
    if (
      new Date(y, m-1, d) < new Date(2022, 4, 10) ||
      new Date(y, m-1, d) > new Date(2022, 4, 13)
    ) {
      showToast('Date must be between May 10–13, 2022.', 'error');
      return;
    }
    const [h, min] = editTime.split(':').map(Number);
    if (h < 9 || h > 17 || (h === 17 && min > 0)) {
      showToast('Time must be between 09:00 and 17:00.', 'error');
      return;
    }
    const newDate = `${editDate}T${editTime}:00`;
    setEditLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await updateBooking(token, editTarget._id, newDate);
      dispatch(updateBookingDate({ id: editTarget._id, bookingDate: newDate }));
      setEditTarget(null);
      showToast(`✅ Updated to ${formatDate(newDate)}`, 'success');
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Update failed'}`, 'error');
    } finally {
      setEditLoading(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deleteBooking(token, cancelTarget._id);
      dispatch(removeBooking(cancelTarget._id));
      setCancelTarget(null);
      showToast('✅ Booking cancelled.', 'success');
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Cancel failed'}`, 'error');
      setCancelTarget(null);
    } finally {
      setCancelLoading(false);
    }
  }


  if (loading) return (
    <div className="bookings-list">
      {[0, 1].map((i) => (
        <div key={i} className="booking-skeleton">
          <div className="sk-line sk-wide" />
          <div className="sk-line sk-medium" />
          <div className="sk-line sk-narrow" />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <EmptyState
      icon="⚠️"
      title="Could not load bookings"
      message={error}
      action={<button className="btn-primary" onClick={loadBookings}>Retry</button>}
    />
  );

  if (bookings.length === 0) return (
    <EmptyState
      icon="📋"
      title="No bookings yet"
      message="You haven't booked any sessions yet."
      action={<a href="/book-company" className="btn-primary">Browse Companies</a>}
    />
  );

  return (
    <>
      <div className="bookings-list">
        {bookings.map((booking, i) => (
          <Card
            key={booking._id}
            booking={booking}
            index={i}
            onEdit={openEditModal}
            onCancel={(b) => setCancelTarget(b)}
            onDetail={(b) => setDetailTarget(b)}
            userReview={reviewMap[booking.company._id] ?? null}
            onDeleteReview={(b, r) => setDeleteReviewTarget({ booking: b, review: r })}
          />
        ))}
      </div>

      {editTarget && (
        <EditModal
          target={editTarget}
          date={editDate} time={editTime}
          loading={editLoading}
          onDateChange={setEditDate} onTimeChange={setEditTime}
          onConfirm={confirmEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {cancelTarget && (
        <CancelModal
          target={cancelTarget}
          loading={cancelLoading}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {detailTarget && (
        <DetailModal
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
