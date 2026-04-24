'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { BlogPost } from '../../../../../interface';
import getPosts from '@/libs/getPosts';
import deletePost from '@/libs/deletePost';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
import ConfirmModal from '@/components/modals/ConfirmModal';
import Pagination from '@/components/blog/Pagination';
import '@/styles/admin.css';

const POSTS_PER_PAGE = 10;

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  const loadPosts = useCallback(async (page: number, q: string) => {
    setLoading(true);
    try {
      const res = await getPosts(page, POSTS_PER_PAGE, q);
      setPosts(res.data || []);
      setTotalPages(res.pagination?.totalPages ?? 0);
      setCurrentPage(res.pagination?.page ?? page);
    } catch {
      showToast('❌ Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPosts(currentPage, searchQuery);
  }, [loadPosts, currentPage, searchQuery]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(value.trim());
    }, 400);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deletePost(token, deleteTarget._id);

      showToast('✅ Post deleted successfully.', 'success');
      setDeleteTarget(null);

      const isLastOnPage = posts.length === 1 && currentPage > 1;
      if (isLastOnPage) {
        setCurrentPage((p) => p - 1);
      } else {
        loadPosts(currentPage, searchQuery);
      }
    } catch (err: unknown) {
      showToast(
        `❌ ${err instanceof Error ? err.message : 'Failed to delete'}`,
        'error'
      );
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Blogs Monitor</h1>
          <p className="admin-sub">Review and moderate community blog posts</p>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/dashboard" className="btn-primary">Bookings</Link>
          <Link href="/admin/companies" className="btn-primary">Companies</Link>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Posts</div>
          <div className="stat-value">{posts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Pages</div>
          <div className="stat-value accent">{totalPages}</div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">All Blog Posts</h2>
      </div>
      <SearchBar value={search} onChange={handleSearchChange} placeholder="Search by title or content…" />

      {loading ? (
        <div className="admin-table-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sk-row"><div className="sk-line sk-wide" /></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title={search ? 'No matching posts' : 'No posts yet'}
          message={search ? 'Try a different search term' : 'Blog posts will appear here once users start posting'}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>Title</th><th>Author</th><th>Posted</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => {
                const authorName = typeof post.author === 'object' ? post.author.name : 'Unknown';
                return (
                  <tr key={post._id}>
                    <td className="td-num">{(currentPage - 1) * POSTS_PER_PAGE + i + 1}</td>
                    <td>
                      <div className="td-user-name" style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.title}
                      </div>
                      <div className="td-user-email" style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.content}
                      </div>
                    </td>
                    <td className="td-company">{authorName}</td>
                    <td className="td-date">{formatDate(post.createdAt)}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-admin-delete" onClick={() => setDeleteTarget(post)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Blog Post?"
        message={
          <>
            Remove <strong>&quot;{deleteTarget?.title}&quot;</strong>?
            <br />
            <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>This action cannot be undone.</span>
          </>
        }
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