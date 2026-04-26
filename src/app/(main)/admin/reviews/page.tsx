'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import getCompanies from '@/libs/getCompanies';
import getAllReviews from '@/libs/getAllReviews';
import deleteReview from '@/libs/deleteReview';
import { CompanyItem, ReviewItem } from '../../../../../interface';
import { formatDate, getEffectiveDate } from '@/utils/dateFormat';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import ModalWrapper from '@/components/ModalWrapper';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import DeleteReviewAdminModal from '@/components/modals/review/DeleteReviewAdminModal';

// ── Styles
import '@/styles/admin.css';
import '@/styles/review.css';

// ── Star display (read-only)
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 24 24"
          fill={s <= rating ? '#E8A020' : 'none'}
          stroke={s <= rating ? '#E8A020' : '#C4BDB8'}
          strokeWidth="1.8"
          style={{ width: '16px', height: '16px' }}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

interface ReviewWithCompany extends ReviewItem {
  companyId: string;
  companyName: string;
}

type SortOption = 'date-desc' | 'date-asc';
type EditedFilter = 'all' | 'edited' | 'original';

export default function AdminReviewsPage() {
  const [companies, setCompanies]   = useState<CompanyItem[]>([]);
  const [reviews, setReviews]       = useState<ReviewWithCompany[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState<SortOption>('date-desc');
  const [editedFilter, setEditedFilter] = useState<EditedFilter>('all');
  const { toast, showToast }        = useToast();

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [pickerOpen, setPickerOpen]           = useState(false);
  const [pickerSearch, setPickerSearch]       = useState('');

  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Handlers
  const handleDelete = async (reason: string) => {
    const token = localStorage.getItem('jf_token');
    if (!token || !selectedReviewId) return;

    try {
      setDeleting(true);
      await deleteReview(token, selectedReviewId);
      setReviews((prev) => prev.filter((r) => r._id !== selectedReviewId));
      showToast(`✅ Review deleted. Reason: ${reason || 'Violation of terms'}`, 'success');
      setDeleteModalOpen(false);
    } catch {
      showToast('❌ Failed to delete review', 'error');
    } finally {
      setDeleting(false);
      setSelectedReviewId(null);
    }
  };

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    setLoading(true);
    try {
      const cRes = await getCompanies(token);
      const companiesList = cRes.data || [];
      setCompanies(companiesList);

      const reviewResults = await Promise.allSettled(
        companiesList.map((c) => getAllReviews(token, c._id))
      );

      const all: ReviewWithCompany[] = [];
      reviewResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          (result.value.data || []).forEach((r: ReviewItem) => {
            all.push({
              ...r,
              companyId:   companiesList[idx]._id,
              companyName: companiesList[idx].name,
            });
          });
        }
      });
      setReviews(all);
    } catch {
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived Stats
  const uniqueUsers = new Set(reviews.map((r) => (typeof r.user === 'object' ? r.user._id : r.user))).size;
  const editedCount = reviews.filter(r => r.edited).length;

  // ── Filtering & Sorting
  const filteredReviews = reviews
    .filter((r) => {
      if (selectedCompany && r.companyId !== selectedCompany._id) return false;
      if (editedFilter === 'edited' && !r.edited) return false;
      if (editedFilter === 'original' && r.edited) return false;

      const q = search.toLowerCase();
      if (!q) return true;
      const userName = typeof r.user === 'object' ? r.user.name : '';
      return (
        r.companyName.toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const tA = new Date(getEffectiveDate(a)).getTime();
      const tB = new Date(getEffectiveDate(b)).getTime();
      return sortBy === 'date-asc' ? tA - tB : tB - tA;
    });

  const pickerCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="container">
      {/* ── Admin Header ── */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Review Monitor</h1>
          <p className="admin-sub">OVERVIEW AND MODERATION OF ALL USER FEEDBACK</p>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/companies" className="btn-primary">
            Manage Companies
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="stats-row stats-row-4">
        <div className="stat-card">
          <div className="stat-label">Total Reviews</div>
          <div className="stat-value">{loading ? '—' : reviews.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Edited Reviews</div>
          <div className="stat-value" style={{ color: '#E8A020' }}>{loading ? '—' : editedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Companies</div>
          <div className="stat-value accent">{loading ? '—' : companies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Users</div>
          <div className="stat-value">{loading ? '—' : uniqueUsers}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="review-sort-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="section-title">All Feedbacks</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={editedFilter}
            onChange={(e) => setEditedFilter(e.target.value as EditedFilter)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="edited">Edited Only ✏️</option>
            <option value="original">Original Only</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="filter-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="review-monitor-controls">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by user, company, or content..." />
        
        {selectedCompany ? (
          <div className="active-company-badge">
            <button className="badge-clear" onClick={() => setSelectedCompany(null)}>
              🏢 {selectedCompany.name} ✕
            </button>
          </div>
        ) : (
          <button className="btn-select-company" onClick={() => { setPickerOpen(true); setPickerSearch(''); }}>
            Filter by Company
          </button>
        )}
      </div>

      {/* ── Review Feed ── */}
      {loading ? (
        <div className="admin-review-skeleton">
          {[0, 1, 2].map((i) => <div key={i} className="admin-review-sk-card" />)}
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews found" message="Try adjusting your filters or search terms." />
      ) : (
        <div className="admin-reviews-feed">
          {filteredReviews.map((review) => {
            const userName = typeof review.user === 'object' ? review.user.name : 'Unknown User';
            return (
              <div key={review._id} className={`admin-review-card ${review.edited ? 'admin-review-card--edited' : ''}`}>
                <div style={{ flex: 1 }}>
                  <div className="admin-review-meta">
                    <span className="meta-tag meta-user">
                       {/* User Icon SVG */}
                       <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                       {userName}
                    </span>
                    <span className="meta-tag">
                       {/* Date Icon SVG */}
                       <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                       {formatDate(getEffectiveDate(review))}
                    </span>
                    {review.edited && <span className="edited-badge">✏️ edited</span>}
                  </div>
                  <div className="admin-review-company">{review.companyName}</div>
                  <div className="admin-review-comment">{review.comment}</div>
                </div>
                <div className="admin-review-actions">
                  <StarDisplay rating={review.rating} />
                  <button 
                    className="btn-admin-delete" 
                    onClick={() => { setSelectedReviewId(review._id); setDeleteModalOpen(true); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <ModalWrapper open={pickerOpen} onClose={() => setPickerOpen(false)}>
        <div className="modal" style={{ maxWidth: 440 }}>
          <h3>Select Company</h3>
          <div style={{ marginTop: 12 }}>
            <SearchBar value={pickerSearch} onChange={setPickerSearch} placeholder="Search companies..." />
          </div>
          <div className="company-picker-list" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: 12 }}>
            <button className={`company-picker-item ${!selectedCompany ? 'active' : ''}`} onClick={() => { setSelectedCompany(null); setPickerOpen(false); }}>
              All Companies
            </button>
            {pickerCompanies.map(c => (
              <button key={c._id} className={`company-picker-item ${selectedCompany?._id === c._id ? 'active' : ''}`} onClick={() => { setSelectedCompany(c); setPickerOpen(false); }}>
                🏢 {c.name}
              </button>
            ))}
          </div>
        </div>
      </ModalWrapper>

      <DeleteReviewAdminModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Toast toast={toast} />
    </div>
  );
}