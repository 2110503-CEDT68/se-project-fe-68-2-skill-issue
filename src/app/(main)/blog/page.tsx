'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost } from '../../../../interface';
import getPosts from '@/libs/getPosts';
import deletePost from '@/libs/deletePost';
import PostCard from '@/components/blog/PostCard';
import DeletePostModal from '@/components/blog/DeletePostModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/blog.css';

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPosts();
      setPosts(res.data || []);
    } catch {
      showToast('❌ Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deletePost(token, deleteTarget._id);
      setPosts(prev => prev.filter(p => p._id !== deleteTarget._id));
      showToast('✅ Post deleted.', 'success');
      setDeleteTarget(null);
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

      {/* Post list */}
      {loading ? (
        <div className="post-list">
          {[0, 1, 2].map(i => (
            <div key={i} className="post-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="blog-empty">No posts yet. Be the first to share!</div>
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