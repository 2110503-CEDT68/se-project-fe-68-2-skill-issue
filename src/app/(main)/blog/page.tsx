'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost } from '../../../../interface';
import getPosts from '@/libs/getPosts';
import deletePost from '@/libs/deletePost';
import PostCard from '@/components/blog/PostCard';
import DeletePostModal from '@/components/blog/DeletePostModal';
import Pagination from '@/components/blog/Pagination';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/blog.css';

const POSTS_PER_PAGE = 6;

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u._id || '');
        setCurrentUserName(u.name || '');
      }
    } catch { /* ignore */ }
  }, []);

  const loadPosts = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const res = await getPosts(page, POSTS_PER_PAGE, search);
      setPosts(res.data || []);
      setTotalPages(res.pagination?.totalPages ?? 0);
      setCurrentPage(res.pagination?.page ?? page);
    } catch {
      showToast('❌ Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when page or search changes
  useEffect(() => {
    loadPosts(currentPage, searchQuery);
  }, [loadPosts, currentPage, searchQuery]);

  // Debounce search input → reset to page 1
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(value.trim());
    }, 400);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deletePost(token, deleteTarget._id);
      showToast('✅ Post deleted.', 'success');
      setDeleteTarget(null);
      // If last post on this page and not page 1, go back
      const isLastOnPage = posts.length === 1 && currentPage > 1;
      if (isLastOnPage) {
        setCurrentPage(p => p - 1);
      } else {
        loadPosts(currentPage, searchQuery);
      }
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="blog-page">
      {/* Header */}
      <div className="blog-header">
        <div className="blog-header-text">
          <h1>Job Fair Community</h1>
          <p>Explore and exchange opinion</p>
        </div>
        {currentUserId && (
          <button className="btn-create-post" onClick={() => router.push('/blog/create')}>
            Create Post Now!!
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="blog-search-wrapper">
        <input
          className="blog-search"
          type="text"
          placeholder="Search posts..."
          value={searchInput}
          onChange={handleSearchChange}
        />
        {searchInput && (
          <button
            className="blog-search-clear"
            onClick={() => { setSearchInput(''); setCurrentPage(1); setSearchQuery(''); }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Post list */}
      {loading ? (
        <div className="post-list">
          {Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
            <div key={i} className="post-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="blog-empty">
          {searchQuery ? `No results for "${searchQuery}"` : 'No posts yet. Be the first to share!'}
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post, idx) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              index={idx}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {deleteTarget && (
        <DeletePostModal
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}