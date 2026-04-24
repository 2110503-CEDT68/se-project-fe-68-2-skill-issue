'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { BlogPost, BlogComment } from '../../../../../../interface';
import getPost from '@/libs/getPost';
import deletePost from '@/libs/deletePost';
import getComments from '@/libs/getComments';
import deleteComment from '@/libs/deleteComment';
import DeleteCommentAdminModal from '@/components/modals/blog/DeleteCommentAdminModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import ContentRemovedPage from '@/components/blog/ContentRemovedPage';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/blog.css';
import '@/styles/admin.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminBlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [deletePostSubmitting, setDeletePostSubmitting] = useState(false);

  const [deleteCommentTarget, setDeleteCommentTarget] = useState<BlogComment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  const { toast, showToast } = useToast();

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [postData, commentRes] = await Promise.all([
        getPost(postId),
        getComments(postId),
      ]);

      if (!postData) { setNotFound(true); return; }

      setPost(postData);
      const raw = commentRes.data || [];
      setComments([...raw].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  async function handleDeletePost() {
    if (!post) return;
    setDeletePostSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deletePost(token, post._id);
      showToast('✅ Post removed successfully.', 'success');
      setTimeout(() => router.push('/admin/blog'), 800);
    } catch (err: unknown) {
      showToast(
        `❌ ${err instanceof Error ? err.message : 'Failed to remove post'}`,
        'error'
      );
      setDeletePostSubmitting(false);
      setShowDeletePostModal(false);
    }
  }

  async function handleDeleteComment(reason: string) {
    if (!deleteCommentTarget || !post) return;
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    setDeletingComment(true);
    try {
      await deleteComment(token, post._id, deleteCommentTarget._id);
      setComments(prev => prev.filter(c => c._id !== deleteCommentTarget._id));
      showToast(`✅ Comment deleted. Reason: ${reason}`, 'success');
      setDeleteCommentTarget(null);
    } catch {
      showToast('❌ Failed to delete comment', 'error');
    } finally {
      setDeletingComment(false);
    }
  }

  if (!loading && notFound) return <ContentRemovedPage />;

  if (loading) {
    return (
      <div className="blog-page">
        <div className="post-skeleton" style={{ height: 220, marginBottom: 16 }} />
        <div className="post-skeleton" style={{ height: 80 }} />
      </div>
    );
  }

  if (!post) return null;

  const authorName = typeof post.author === 'object' ? post.author.name : 'Unknown';

  return (
    <div className="blog-page">
      <Link href="/admin/blog" className="post-back-link">← Back to Blogs Monitor</Link>

      <article className="post-card">
        <div className="post-detail-meta-row">
          <div className="post-detail-meta-left">
            <span className="create-post-author">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {authorName}
            </span>
            <span className="post-card-date">{formatDate(post.createdAt)}</span>
          </div>
          <div className="blog-post-actions">
            <span style={{
              fontSize: '0.72rem', fontWeight: 600,
              color: '#c0392b', background: '#fdf0ee',
              border: '1px solid #f5c6c0',
              borderRadius: 6, padding: '3px 10px',
            }}>
              👁 Admin View
            </span>
            <button
              className="btn-post-delete"
              onClick={() => setShowDeletePostModal(true)}
            >
              delete
            </button>
          </div>
        </div>

        <h1 className="post-detail-title">{post.title}</h1>
        <p className="post-detail-content">{post.content}</p>

        <hr className="post-detail-divider" />

        <div className="post-comment-list">
          <p className="post-comment-total" style={{ marginBottom: 12 }}>
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </p>

          {comments.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No comments yet.</p>
          ) : (
            <>
              {[...comments]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((c) => {
                  const name =
                    typeof c.author === 'object' && c.author !== null
                      ? (c.author as { name?: string }).name || 'Anonymous'
                      : 'Anonymous';
                  return (
                    <div key={c._id} className="post-comment-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p className="post-comment-author" style={{ margin: 0 }}>{name}</p>
                        <button
                          className="btn-post-delete"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => setDeleteCommentTarget(c)}
                        >
                          delete
                        </button>
                      </div>
                      <p className="post-comment-text">{c.text}</p>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </article>

      <ConfirmModal
        open={showDeletePostModal}
        title="Remove Blog Post?"
        message={
          <>
            Remove <strong>&quot;{post.title}&quot;</strong> for policy violation?
            <br />
            <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
              This action cannot be undone. The author will no longer be able to access this post.
            </span>
          </>
        }
        confirmText="Remove Post"
        loadingText="Removing…"
        loading={deletePostSubmitting}
        onConfirm={handleDeletePost}
        onClose={() => setShowDeletePostModal(false)}
      />

      <DeleteCommentAdminModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleDeleteComment}
        loading={deletingComment}
      />

      <Toast toast={toast} />
    </div>
  );
}