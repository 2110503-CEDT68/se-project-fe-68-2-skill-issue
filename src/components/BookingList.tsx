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

import { setBookings, removeBooking, updateBookingDate } from '../redux/features/bookSlice';
import { RootState } from '../redux/store';
import { BookingItem } from '../../interface';
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

  // ── GET /api/v1/bookings → dispatch to Redux store
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

  // ── Open edit modal — parse ISO → date + time
  function openEditModal(booking: BookingItem) {
    setEditTarget(booking);
    const iso = booking.bookingDate || '';
    setEditDate(iso.slice(0, 10) || '2022-05-10');
    setEditTime(iso.length > 10 ? iso.slice(11, 16) : '09:00');
  }

  // ── PUT /api/v1/bookings/:id
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

  // ── DELETE /api/v1/bookings/:id
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

  // ── Skeleton
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

  // ── Error
  if (error) return (
    <EmptyState
      icon="⚠️"
      title="Could not load bookings"
      message={error}
      action={<button className="btn-primary" onClick={loadBookings}>Retry</button>}
    />
  );

  // ── Empty
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
      {/* ── Booking Cards */}
      <div className="bookings-list">
        {bookings.map((booking, i) => (
          <Card
            key={booking._id}
            booking={booking}
            index={i}
            onEdit={openEditModal}
            onCancel={(b) => setCancelTarget(b)}
            onDetail={(b) => setDetailTarget(b)}
          />
        ))}
      </div>

      {/* ── Modals */}
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

      {/* ── Toast */}
      <Toast toast={toast} />
    </>
  );
}