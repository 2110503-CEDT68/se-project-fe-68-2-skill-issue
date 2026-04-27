'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import getBookings from '@/libs/getBookings';
import getCompanies from '@/libs/getCompanies';
import updateBooking from '@/libs/updateBooking';
import deleteBooking from '@/libs/deleteBooking';
import { BookingItem, CompanyItem } from '../../../../../interface';
import { formatDate } from '@/utils/dateFormat';
import { timeOptions } from '@/utils/timeOptions';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import ModalWrapper from '@/components/ModalWrapper';
import ConfirmModal from '@/components/modals/ConfirmModal';
import '@/styles/admin.css';

export default function AdminDashboardPage() {
  const [bookings, setBookings]   = useState<BookingItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const { toast, showToast }      = useToast();

  // Edit modal state
  const [editTarget, setEditTarget]     = useState<BookingItem | null>(null);
  const [editDate, setEditDate]         = useState('');
  const [editTime, setEditTime]         = useState('09:00');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget]       = useState<BookingItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Search
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc'>('date-desc');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    try {
      const [bRes, cRes] = await Promise.all([
        getBookings(token),
        getCompanies(token),
      ]);
      setBookings(bRes.data);
      setCompanies(cRes.data);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter + sort bookings
  const filtered = bookings
    .filter((b) => {
      const q = search.toLowerCase();
      return (
        b.company?.name?.toLowerCase().includes(q) ||
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date-asc')
        return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });

  // ── Edit handlers
  function openEdit(b: BookingItem) {
    setEditTarget(b);
    const iso = b.bookingDate || '';
    setEditDate(iso.slice(0, 10));
    setEditTime(iso.length > 10 ? iso.slice(11, 16) : '09:00');
  }
  async function handleEditConfirm() {
    if (!editTarget || !editDate) return;
    setEditSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token')!;
      const newDate = `${editDate}T${editTime}:00`;
      await updateBooking(token, editTarget._id, newDate);
      showToast('Booking updated', 'success');
      setEditTarget(null);
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setEditSubmitting(false);
    }
  }

  // ── Delete handlers
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token')!;
      await deleteBooking(token, deleteTarget._id);
      showToast('Booking deleted', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Manage all bookings and companies</p>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/companies" className="btn-primary">
            Manage Companies
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{bookings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Companies</div>
          <div className="stat-value accent">{companies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Users</div>
          <div className="stat-value">
            {new Set(bookings.map((b) => b.user?.email).filter(Boolean)).size}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="section-header">
        <h2 className="section-title">All Bookings</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="filter-select"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>
      </div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by company, user name, or email…"
      />

      {/* Booking table */}
      {loading ? (
        <div className="admin-table-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sk-row"><div className="sk-line sk-wide" /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={search ? 'No matching bookings' : 'No bookings yet'}
          message={search ? 'Try a different search term' : 'Bookings will appear here once users start booking'}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Company</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b._id}>
                  <td className="td-num">{i + 1}</td>
                  <td>
                    <div className="td-user-name">{b.user?.name || '—'}</div>
                    <div className="td-user-email">{b.user?.email || ''}</div>
                  </td>
                  <td className="td-company">{b.company?.name || '—'}</td>
                  <td className="td-date">{formatDate(b.bookingDate)}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-admin-edit" onClick={() => openEdit(b)}>Edit</button>
                      <button className="btn-admin-delete" onClick={() => setDeleteTarget(b)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <ModalWrapper open={!!editTarget} onClose={() => setEditTarget(null)}>
        <div className="modal-icon">📅</div>
        <h3>Edit Booking Date</h3>
        <p>
          <strong>{editTarget?.user?.name}</strong> → {editTarget?.company?.name}
        </p>
        <input
          type="date"
          className="admin-date-input"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          min="2022-05-10"
          max="2022-05-13"
        />
        <select
          className="admin-date-input"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          style={{ marginTop: 10 }}
        >
          {timeOptions().map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-modal-cancel" onClick={() => setEditTarget(null)}>Cancel</button>
          <button
            className="btn-modal-confirm"
            style={{ background: 'var(--text)' }}
            disabled={editSubmitting || !editDate}
            onClick={handleEditConfirm}
          >
            {editSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </ModalWrapper>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Booking"
        message={<>Remove <strong>{deleteTarget?.user?.name || 'this user'}</strong>&apos;s booking at <strong>{deleteTarget?.company?.name}</strong>?</>}
        confirmText="Delete"
        loadingText="Deleting…"
        loading={deleteSubmitting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}