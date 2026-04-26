'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import getPosts from '@/libs/getPosts';
import getComments from '@/libs/getComments';
import deleteComment from '@/libs/deleteComment';
import { BlogPost, BlogComment } from '../../../../../interface';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import DeleteCommentAdminModal from '@/components/modals/blog/DeleteCommentAdminModal';
import '@/styles/admin.css';
import '@/styles/blog.css';

interface CommentWithPost extends BlogComment {
  postId: string;
  postTitle: string;
}

type SortOption = 'date-desc' | 'date-asc';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const { toast, showToast } = useToast();

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<CommentWithPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all posts (paginate through all pages)
      const firstPage = await getPosts(1, 100);
      const allPosts: BlogPost[] = firstPage.data || [];

      // If more pages exist, fetch them
      const totalPages: number = firstPage.pagination?.totalPages ?? 1;
      if (totalPages > 1) {
        const pagePromises = [];
        for (let p = 2; p <= totalPages; p++) {
          pagePromises.push(getPosts(p, 100));
        }
        const rest = await Promise.allSettled(pagePromises);
        rest.forEach((r) => {
          if (r.status === 'fulfilled') allPosts.push(...(r.value.data || []));
        });
      }

      // Fetch comments for all posts in parallel
      const commentResults = await Promise.allSettled(
        allPosts.map((post) => getComments(post._id))
      );

      const all: CommentWithPost[] = [];
      commentResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          (result.value.data || []).forEach((c: BlogComment) => {
            all.push({
              ...c,
              postId: allPosts[idx]._id,
              postTitle: allPosts[idx].title,
            });
          });
        }
      });

      setComments(all);
    } catch {
      showToast('❌ Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleDeleteComment(reason: string) {
    if (!deleteTarget) return;
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    setDeleting(true);
    try {
      await deleteComment(token, deleteTarget.postId, deleteTarget._id);
      setComments((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      showToast(`✅ Comment deleted. Reason: ${reason}`, 'success');
      setDeleteTarget(null);
    } catch {
      showToast('❌ Failed to delete comment', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // Derived stats
  const uniqueAuthors = new Set(
    comments.map((c) =>
      typeof c.author === 'object' && c.author !== null
        ? (c.author as { _id?: string })._id
        : c.author
    )
  ).size;

  const editedCount = comments.filter((c) => c.edited).length;

  // Filter + sort
  const filtered = comments
    .filter((c) => {
      const q = search.toLowerCase();
      if (!q) return true;
      const authorName =
        typeof c.author === 'object' && c.author !== null
          ? (c.author as { name?: string }).name || ''
          : '';
      return (
        c.text.toLowerCase().includes(q) ||
        authorName.toLowerCase().includes(q) ||
        c.postTitle.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortBy === 'date-asc' ? tA - tB : tB - tA;
    });

  return (
    <div className="container">
      {/* ── Header ── */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Comments Monitor</h1>
          <p className="admin-sub">OVERVIEW AND MODERATION OF ALL BLOG COMMENTS</p>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/blog" className="btn-primary">Blogs Monitor</Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Comments</div>
          <div className="stat-value">{loading ? '—' : comments.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Edited Comments</div>
          <div className="stat-value" style={{ color: '#E8A020' }}>
            {loading ? '—' : editedCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Authors</div>
          <div className="stat-value accent">{loading ? '—' : uniqueAuthors}</div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="review-sort-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="section-title">All Comments</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="filter-select"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>
      </div>

      <div className="review-monitor-controls">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by author, blog title, or content…"
        />
      </div>

      {/* ── Comment Feed ── */}
      {loading ? (
        <div className="admin-review-skeleton">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="admin-review-sk-card" style={{ height: 88 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No comments found"
          message={search ? 'Try adjusting your search.' : 'No comments have been posted yet.'}
        />
      ) : (
        <div className="admin-reviews-feed">
          {filtered.map((comment) => {
            const authorName =
              typeof comment.author === 'object' && comment.author !== null
                ? (comment.author as { name?: string }).name || 'Anonymous'
                : 'Anonymous';

            return (
              <div
                key={comment._id}
                className="admin-review-card"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
              >
                {/* Top row: author + date + edited badge */}
                <div className="admin-review-meta" style={{ marginBottom: 0 }}>
                  <span className="meta-tag meta-user">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {authorName}
                  </span>
                  <span className="meta-tag">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(comment.createdAt)}
                  </span>
                  {comment.edited && <span className="edited-badge">✏️ edited</span>}
                </div>

                {/* Blog title context */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--muted)', flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span
                    className="admin-review-company"
                    style={{ fontSize: '0.92rem', marginBottom: 0, lineHeight: 1.3 }}
                  >
                    {comment.postTitle}
                  </span>
                </div>

                {/* Comment text */}
                <div className="admin-review-comment">{comment.text}</div>

                {/* Actions row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  {/* View in Context link */}
                  <Link
                    href={`/admin/blog/${comment.postId}?highlight=${comment._id}#comment-${comment._id}`}
                    className="comment-view-context-link"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View in Context
                  </Link>

                  <button
                    className="btn-admin-delete"
                    onClick={() => setDeleteTarget(comment)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete Modal ── */}
      <DeleteCommentAdminModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteComment}
        loading={deleting}
      />

      <Toast toast={toast} />
    </div>
  );
}