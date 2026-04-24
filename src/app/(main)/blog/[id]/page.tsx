'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { BlogPost, BlogComment } from '../../../../../interface';
import getPost from '@/libs/getPost';
import deletePost from '@/libs/deletePost';
import getComments from '@/libs/getComments';
import createComment from '@/libs/createComment';
import deleteComment from '@/libs/deleteComment';
import DeletePostModal from '@/components/blog/DeletePostModal';
import DeleteCommentAdminModal from '@/components/modals/blog/DeleteCommentAdminModal';
import ContentRemovedPage from '@/components/blog/ContentRemovedPage';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/blog.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');

  const [commentInput, setCommentInput] = useState('');
  const [sending, setSending] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteCommentTarget, setDeleteCommentTarget] = useState<BlogComment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  const { toast, showToast } = useToast();

  // Read current user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u._id || '');
        setCurrentUserName(u.name || '');
        setCurrentUserRole(u.role || '');
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch post + comments
  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [postData, commentRes] = await Promise.all([
        getPost(postId),
        getComments(postId),
      ]);

      if (!postData) {
        setNotFound(true);
        return;
      }

      setPost(postData);

      const raw = commentRes.data || [];
      const sorted = [...raw].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setComments(sorted);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  // ── Delete (owner only)
  async function handleDelete() {
    if (!post) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deletePost(token, post._id);
      // Store pending toast message; blog feed page will read and display it
      sessionStorage.setItem('blog_toast', 'Blog deleted');
      router.push('/blog');
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Failed to delete'}`, 'error');
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  // ── Send comment
  async function handleSendComment() {
    const text = commentInput.trim();
    const token = localStorage.getItem('jf_token');
    if (!text || sending || !token || !post) return;

    setSending(true);
    try {
      await createComment(token, post._id, text);
      // Optimistic update — mirrors PostCard pattern
      const newComment: any = {
        _id: Date.now().toString(),
        text,
        author: { _id: currentUserId, name: currentUserName },
        blog: post._id,
        createdAt: new Date().toISOString(),
      };
      setComments(prev => [...prev, newComment]);
      setCommentInput('');
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSending(false);
    }
  }

  const isAdmin = currentUserRole === 'admin';

  async function handleAdminDeleteComment(reason: string) {
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

  // ── Render: Content removed by admin (404 / deleted)
  if (!loading && notFound) {
    return <ContentRemovedPage />;
  }

  // ── Render: Loading skeleton
  if (loading) {
    return (
      <div className="blog-page">
        <div className="post-skeleton" style={{ height: 220, marginBottom: 16 }} />
        <div className="post-skeleton" style={{ height: 80 }} />
      </div>
    );
  }

  if (!post) return null;

  const authorName =
    typeof post.author === 'object' ? post.author.name : 'User';
  const isOwner =
    currentUserId &&
    (typeof post.author === 'object' ? post.author._id : post.author) === currentUserId;

  return (
    <div className="blog-page">
      {/* ── Back link */}
      <Link href="/blog" className="post-back-link">
        ← Back to Blog Feed
      </Link>

      {/* ── Post body */}
      <article className="post-card">

        {/* Meta row */}
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

          {/* Edit & Delete buttons — visible only to the post owner */}
          {isOwner && (
            <div className="blog-post-actions">
              <Link href={`/blog/${post._id}/edit`} className="btn-post-edit">
                edit
              </Link>
              <button
                className="btn-post-delete"
                onClick={() => setShowDeleteModal(true)}
                aria-label="Delete this post"
              >
                delete
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="post-detail-title">{post.title}</h1>

        {/* Content */}
        <p className="post-detail-content">{post.content}</p>

        <hr className="post-detail-divider" />

        {/* ── Comments */}
        {comments.length > 0 && (
          <div className="post-comment-list">
            <p className="post-comment-total">
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </p>
            {[...comments]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((c) => {
                const name =
                  typeof c.author === 'object' && c.author !== null
                    ? (c.author as { name?: string }).name || 'Anonymous'
                    : c.author === currentUserId
                    ? currentUserName
                    : 'Anonymous';
                const isMe =
                  typeof c.author === 'object' && c.author !== null
                    ? (c.author as { _id?: string })._id === currentUserId
                    : c.author === currentUserId;

                return (
                  <div key={c._id} className="post-comment-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className="post-comment-author" style={{ margin: 0 }}>
                        {name}
                        {isMe && <span className="post-comment-you"> (You)</span>}
                      </p>
                      {isAdmin && (
                        <button
                          className="btn-post-delete"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => setDeleteCommentTarget(c)}
                        >
                          delete
                        </button>
                      )}
                    </div>
                    <p className="post-comment-text">{c.text}</p>
                  </div>
                );
              })}
          </div>
        )}

        {/* Comment input — only for logged-in users */}
        {currentUserId && (
          <div className="post-comment-box">
            <input
              className="post-comment-input"
              placeholder="Write a comment…"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              maxLength={100}
              onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
            />
            <button
              className="post-comment-send"
              onClick={handleSendComment}
              disabled={sending || !commentInput.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        )}
      </article>

      {/* ── Delete confirmation modal */}
      {showDeleteModal && (
        <DeletePostModal
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      <DeleteCommentAdminModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleAdminDeleteComment}
        loading={deletingComment}
      />

      <Toast toast={toast} />
    </div>
  );
}