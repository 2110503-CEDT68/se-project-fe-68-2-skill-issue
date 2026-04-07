import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import getCompanies  from '@/libs/getCompanies';
import getBookings   from '@/libs/getBookings';
import createBooking from '@/libs/createBooking';
import updateBooking from '@/libs/updateBooking';
import deleteBooking from '@/libs/deleteBooking';

import { setBookings, removeBooking, updateBookingDate } from '@/redux/features/bookSlice';
import { validateBookingDate } from '@/utils/validateBooking';
import { RootState } from '@/redux/store';
import { CompanyItem, BookingItem } from '../../interface';
import { useToast } from './useToast';

export function useBookCompany() {
  const dispatch     = useDispatch();
  const bookingCount = useSelector((state: RootState) => state.book.bookItems.length);

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) setIsAdmin(JSON.parse(raw)?.role === 'admin');
    } catch { /* ignore */ }
  }, []);

  const isFull = !isAdmin && bookingCount >= 3;

  const [companies,    setCompanies]    = useState<CompanyItem[]>([]);
  const [bookingMap,   setBookingMap]   = useState<Record<string, BookingItem>>({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const { toast, showToast }            = useToast();

  const [selected,     setSelected]     = useState<CompanyItem | null>(null);
  const [editMode,     setEditMode]     = useState(false);
  const [bookDate,     setBookDate]     = useState('2022-05-10');
  const [bookTime,     setBookTime]     = useState('09:00');
  const [submitting,   setSubmitting]   = useState(false);

  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelling,   setCancelling]   = useState(false);

  // ── GET /companies + GET /bookings
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jf_token') || '';
      const companiesRes = await getCompanies(token);
      setCompanies(companiesRes.data || []);

      if (token) {
        const bookingsRes = await getBookings(token);
        const map: Record<string, BookingItem> = {};
        const raw = localStorage.getItem('jf_user');
        const userId = raw ? JSON.parse(raw)?._id : null;

        (bookingsRes.data || []).forEach((b) => {
          const cid = b.company?._id;
          if (cid && (!userId || b.user?._id === userId)) map[cid] = b;
        });
        setBookingMap(map);
        dispatch(setBookings(bookingsRes.data || []));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Open Book Modal
  function openBookModal(company: CompanyItem) {
    setSelected(company);
    setEditMode(false);
    setBookDate('2022-05-10');
    setBookTime('09:00');
  }

  // ── Open Edit Modal
  function openEditModal(company: CompanyItem) {
    const booking = bookingMap[company._id];
    if (!booking) return;
    setSelected(company);
    setEditMode(true);
    const iso = booking.bookingDate || '';
    if (iso.length > 10) {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        setBookDate(
          `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        );
        setBookTime(
          `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        );
        return;
      }
    }
    setBookDate('2022-05-10');
    setBookTime('09:00');
  }

  // ── POST or PUT
  async function confirmBooking() {
    if (!selected) return;
    const validationError = validateBookingDate(bookDate, bookTime);
    if (validationError) { showToast(validationError, 'error'); return; }

    const newDate = `${bookDate}T${bookTime}:00`;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      if (editMode) {
        const booking = bookingMap[selected._id];
        await updateBooking(token, booking._id, newDate);
        dispatch(updateBookingDate({ id: booking._id, bookingDate: newDate }));
        setBookingMap(prev => ({
          ...prev,
          [selected._id]: { ...prev[selected._id], bookingDate: newDate },
        }));
        showToast(`✅ Updated booking for ${selected.name}`, 'success');
      } else {
        const res = await createBooking(token, selected._id, newDate);
        const newBooking = res.data;
        setBookingMap(prev => ({ ...prev, [selected._id]: newBooking }));
        dispatch(setBookings(
          Object.values({ ...bookingMap, [selected._id]: newBooking }) as BookingItem[]
        ));
        showToast(`✅ Booked ${selected.name} successfully!`, 'success');
      }
      setSelected(null);
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── DELETE
  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deleteBooking(token, cancelTarget._id);
      dispatch(removeBooking(cancelTarget._id));
      const companyId = cancelTarget.company?._id;
      setBookingMap(prev => {
        const next = { ...prev };
        delete next[companyId];
        return next;
      });
      setCancelTarget(null);
      showToast('✅ Booking cancelled.', 'success');
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Cancel failed'}`, 'error');
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  }

  const filtered = search
    ? companies.filter(c =>
        (c.name        || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.address     || '').toLowerCase().includes(search.toLowerCase())
      )
    : companies;

  return {
    // state
    companies, filtered, bookingMap, loading, error,
    search, setSearch, toast, isFull,
    // modal: book/edit
    selected, setSelected,
    editMode,
    bookDate, setBookDate,
    bookTime, setBookTime,
    submitting,
    // modal: cancel
    cancelTarget, setCancelTarget,
    cancelling,
    // functions
    loadData,
    openBookModal,
    openEditModal,
    confirmBooking,
    confirmCancel,
  };
}