'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import getCompanies from '@/libs/getCompanies';
import getAllReviews from '@/libs/getAllReviews';
import { CompanyItem, ReviewItem } from '../../../../../interface';
import { formatDate } from '@/utils/dateFormat';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
import ModalWrapper from '@/components/ModalWrapper';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/admin.css';
import '@/styles/review.css';
import deleteReview from '@/libs/deleteReview';
import DeleteReviewAdminModal from '@/components/modals/DeleteReviewAdminModal';

// ── Star display (read-only)
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 24 24"
          fill={s <= rating ? '#E8A020' : 'none'}
          stroke={s <= rating ? '#E8A020' : '#C4BDB8'}
          strokeWidth="1.8"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ── Extended ReviewItem with company info attached
interface ReviewWithCompany extends ReviewItem {
  companyId: string;
  companyName: string;
}

export default function AdminReviewsPage() {
  const [companies, setCompanies]   = useState<CompanyItem[]>([]);
  const [reviews, setReviews]       = useState<ReviewWithCompany[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState<'date-desc' | 'date-asc'>('date-desc');
  const { toast, showToast }        = useToast();

  // Company filter
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [pickerOpen, setPickerOpen]           = useState(false);
  const [pickerSearch, setPickerSearch]       = useState('');

  //Admin Delete Review
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async (reason: string) => {
  const token = localStorage.getItem('jf_token');
  if (!token || !selectedReviewId) return;

  try {
    setDeleting(true);

    await deleteReview(token, selectedReviewId);

    setReviews((prev) =>
      prev.filter((r) => r._id !== selectedReviewId)
    );

    showToast('Review deleted successfully', 'success');
    setDeleteModalOpen(false);
  } catch {
    showToast('Failed to delete review', 'error');
  } finally {
    setDeleting(false);
  }
};




  // Total unique users (across all reviews)
  const uniqueUsers = new Set(
    reviews.map((r) => (typeof r.user === 'object' ? r.user._id : r.user))
  ).size;

  // ── Load companies then all reviews
  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    setLoading(true);
    try {
      const cRes = await getCompanies(token);
      const companiesList = cRes.data || [];
      setCompanies(companiesList);

      // Fetch reviews for every company in parallel
      const reviewResults = await Promise.allSettled(
        companiesList.map((c) => getAllReviews(token, c._id))
      );

      const all: ReviewWithCompany[] = [];
      reviewResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          (result.value.data || []).forEach((r) => {
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

  // ── Derive filtered list
  const filteredReviews = reviews
    .filter((r) => {
      // Company filter
      if (selectedCompany && r.companyId !== selectedCompany._id) return false;

      // Keyword search (company name, user name, comment)
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
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortBy === 'date-asc' ? tA - tB : tB - tA;
    });

  // Companies shown in picker (filtered by pickerSearch)
  const pickerCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  // Total reviews shown for selected company (used for AC2)
  const showingNoReviews =
    !loading &&
    selectedCompany !== null &&
    filteredReviews.length === 0 &&
    search === '';

  return (
    <div className="container">
      {/* ── Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard Review Monitor</h1>
          <p className="admin-sub">MANAGE ALL BOOKINGS AND COMPANIES</p>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/companies" className="btn-primary">
            Manage Companies
          </Link>
        </div>
      </div>

      {/* ── Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Reviews</div>
          <div className="stat-value">{loading ? '—' : reviews.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Companies</div>
          <div className="stat-value accent">{loading ? '—' : companies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique User</div>
          <div className="stat-value">{loading ? '—' : uniqueUsers}</div>
        </div>
      </div>

      {/* ── Section header */}
      <div className="review-sort-row">
        <h2 className="section-title">All Reviews</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="filter-select"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>
      </div>

      {/* ── Search + Company picker */}
      <div className="review-monitor-controls">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by Keywords"
        />
        <button className="btn-select-company" onClick={() => { setPickerOpen(true); setPickerSearch(''); }}>
          Select Companies
        </button>
      </div>

      {/* Active company badge */}
      {selectedCompany && (
        <div className="active-company-badge">
          🏢 {selectedCompany.name}
          <button className="badge-clear" onClick={() => setSelectedCompany(null)} title="Clear filter">✕</button>
        </div>
      )}

      {/* ── Review list */}
      {loading ? (
        <div className="admin-review-skeleton">
          {[0, 1, 2].map((i) => (
            <div key={i} className="admin-review-sk-card">
              <div className="sk-line sk-wide" />
              <div className="sk-line sk-medium" />
              <div className="sk-line sk-narrow" />
            </div>
          ))}
        </div>
      ) : showingNoReviews ? (
        // AC2: company selected but has zero reviews
        <div className="admin-no-reviews">
          This company has no review yet
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={search ? 'No matching reviews' : 'No reviews yet'}
          message={search ? 'Try a different search term' : 'Reviews will appear here once users submit them'}
        />
      ) : (
        <div className="admin-reviews-feed">
          {filteredReviews.map((review, idx) => {
            const userName = typeof review.user === 'object' ? review.user.name : 'Unknown';
            return (
              <div key={review._id} className="admin-review-card">
                <div style={{ flex: 1 }}>
                  <div className="admin-review-meta">
                    <span className="meta-tag meta-user" title={userName}>
                       <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg> {userName}
                    </span>
                    <span className="meta-tag">
                       <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg> {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="admin-review-company">{review.companyName}</div>
                  <div className="admin-review-comment">{review.comment}</div>
                </div>
                
                <div className="admin-review-actions">
                  <StarDisplay rating={review.rating} />
                  <button 
                    className="btn-admin-delete" 
                    onClick={() => {setSelectedReviewId(review._id);
                                    setDeleteModalOpen(true);}}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Company Picker Modal */}
      <ModalWrapper open={pickerOpen} onClose={() => setPickerOpen(false)}>
        <div className="modal" style={{ maxWidth: 440, textAlign: 'left' }}>
          <h3>Select Company</h3>
          <p className="modal-sub">Filter reviews by a specific company</p>

          <div style={{ margin: '14px 0 0' }}>
            <SearchBar
              value={pickerSearch}
              onChange={setPickerSearch}
              placeholder="Search companies…"
            />
          </div>

          <div className="company-picker-list">
            {/* "All" option */}
            <button
              className={`company-picker-item${!selectedCompany ? ' active' : ''}`}
              onClick={() => { setSelectedCompany(null); setPickerOpen(false); }}
            >
              <span>All Companies</span>
              {!selectedCompany && <span className="company-picker-check">✓</span>}
            </button>

            {pickerCompanies.map((c) => (
              <button
                key={c._id}
                className={`company-picker-item${selectedCompany?._id === c._id ? ' active' : ''}`}
                onClick={() => { setSelectedCompany(c); setPickerOpen(false); }}
              >
                <span>🏢 {c.name}</span>
                {selectedCompany?._id === c._id && (
                  <span className="company-picker-check">✓</span>
                )}
              </button>
            ))}

            {pickerCompanies.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '.85rem' }}>
                No companies found
              </p>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button className="btn-modal-cancel" onClick={() => setPickerOpen(false)}>Close</button>
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
