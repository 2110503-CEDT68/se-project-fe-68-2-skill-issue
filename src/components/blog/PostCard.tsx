'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost, BlogComment } from '../../../interface';
import createComment from '@/libs/createComment';
import getComments from '@/libs/getComments';
import deleteComment from '@/libs/deleteComment';
import DeleteCommentAdminModal from '@/components/modals/blog/DeleteCommentAdminModal';
import DeletePostAdminModal from '@/components/blog/DeletePostAdminModal';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface PostCardProps {
  post: BlogPost;
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: string;
  index: number;
  onDelete: (post: BlogPost) => void;
  onEditComment: (comment: BlogComment) => void;
  onDeleteComment: (comment: BlogComment) => void;
}

export default function PostCard({
  post, currentUserId, currentUserName, currentUserRole, index,
  onDelete, onEditComment, onDeleteComment,
}: PostCardProps) {
  const isAdmin = currentUserRole === 'admin';
  const isOwner = !!currentUserId && (typeof post.author === 'object' ? post.author._id : post.author) === currentUserId;
  const displayName = typeof post.author === 'object' ? post.author.name : 'User';

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  // Admin delete comment
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<BlogComment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  // Admin delete post — modal เปิดตรงนี้ กด confirm ครั้งเดียว
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);

  useEffect(() => {
    getComments(post._id).then(res => {
      const rawComments = res.data || [];
      const sorted = [...rawComments].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setComments(sorted);
    });
  }, [post._id]);

  async function handleSendComment() {
    const text = comment.trim();
    const token = localStorage.getItem('jf_token');
    if (!text || sending || !token) return;
    setSending(true);
    try {
      await createComment(token, post._id, text);
      const res = await getComments(post._id);
      setComments(res.data || []);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleAdminDeleteComment(reason: string) {
    if (!deleteCommentTarget) return;
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    setDeletingComment(true);
    try {
      await deleteComment(token, post._id, deleteCommentTarget._id);
      setComments(prev => prev.filter(c => c._id !== deleteCommentTarget._id));
      setDeleteCommentTarget(null);
    } catch (err) {
      console.error('Delete comment failed:', err);
    } finally {
      setDeletingComment(false);
    }
  }

  // Admin กด confirm policy → ปิด modal → แจ้ง parent ลบ (ไม่ต้องกดอีกรอบ)
  function handleAdminDeletePostConfirm(_reason: string) {
    setShowDeletePostModal(false);
    onDelete(post);
  }

  return (
    <div className="post-card" style={{ animationDelay: `${index * 0.06}s` }}>

      {/* ── Post Header: author + date (left) | actions (right) ── */}
      <div className="post-card-header-row">
        <div className="post-card-meta-left">
          <span className="create-post-author">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {displayName}
          </span>
          <span className="post-card-date">{formatDate(post.createdAt)}</span>
        </div>

        <div className="post-card-actions">
          {isOwner && (
            <Link href={`/blog/${post._id}/edit`} className="btn-post-edit">edit</Link>
          )}
          {isOwner && (
            <button className="btn-post-delete-pill" onClick={() => onDelete(post)}>
              Delete
            </button>
          )}
          {isAdmin && (
            <button className="btn-post-delete-pill" onClick={() => setShowDeletePostModal(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Title + Content ── */}
      <h3 className="post-card-title">{post.title}</h3>
      <p className="post-card-preview">{post.content}</p>

      <hr className="post-detail-divider" />

      {/* ── Comment List ── */}
      <div className="post-comment-list">
        <p className="post-comment-total">Total Comments: {comments.length}</p>
        {comments.map((c, idx) => {
          const authorObj = (typeof c.author === 'object' && c.author !== null) ? (c.author as any) : null;
          const commentAuthorId = authorObj ? authorObj._id : (typeof c.author === 'string' ? c.author : '');
          const authorName = authorObj ? authorObj.name : 'User';
          const isMe = !!currentUserId && commentAuthorId === currentUserId;

          return (
            <div key={c._id} className="post-comment-item">
              <div className="comment-header-row">
                <div className="comment-label-group">
                  <span className="comment-label">
                    comment {idx + 1} : <strong>{authorName}</strong>
                    {isMe && <span className="post-comment-you"> (You)</span>}
                  </span>
                  <p className="post-comment-text">{c.text}</p>
                </div>

                <div className="comment-action-group">
                  {isMe && !isAdmin && (
                    <>
                      <button className="btn-comment-edit" onClick={() => onEditComment(c)}>Edit</button>
                      <button className="btn-comment-delete-pill" onClick={() => onDeleteComment(c)}>Delete</button>
                    </>
                  )}
                  {isAdmin && (
                    <button className="btn-comment-delete-pill" onClick={() => setDeleteCommentTarget(c)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comment Input ── */}
      <div className="post-comment-box">
        <input
          className="post-comment-input"
          placeholder="Typing the comment ..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendComment()}
        />
        <button className="post-comment-send" onClick={handleSendComment} disabled={sending || !comment.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Admin: Delete Comment Modal */}
      <DeleteCommentAdminModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleAdminDeleteComment}
        loading={deletingComment}
      />

      {/* Admin: Delete Post Modal (policy reason → เรียก onDelete เลย) */}
      <DeletePostAdminModal
        open={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={handleAdminDeletePostConfirm}
      />
    </div>
  );
}