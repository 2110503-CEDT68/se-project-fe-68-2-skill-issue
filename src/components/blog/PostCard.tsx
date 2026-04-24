'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost, BlogComment } from '../../../interface';
import createComment from '@/libs/createComment';
import getComments from '@/libs/getComments';
import deleteComment from '@/libs/deleteComment';
import DeleteCommentAdminModal from '@/components/modals/blog/DeleteCommentAdminModal';

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
  post, currentUserId, currentUserName, index, 
  onDelete, onEditComment, onDeleteComment 
}: PostCardProps) {
  
export default function PostCard({ post, currentUserId, currentUserName, currentUserRole, index, onDelete }: PostCardProps) {
  const isAdmin = currentUserRole === 'admin';
  // เช็คชื่อเจ้าของโพสต์ (ใช้ Logic เดียวกับคอมเมนต์เพื่อความชัวร์)
  const isOwner = currentUserId && (typeof post.author === 'object' ? post.author._id : post.author) === currentUserId;
  const displayName = typeof post.author === 'object' ? post.author.name : 'User';

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<BlogComment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

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

  return (
    <div className="post-card" style={{ animationDelay: `${index * 0.06}s` }}>
      {isOwner && (
        <div className="post-card-actions">
          <Link href={`/blog/${post._id}/edit`} className="btn-post-edit">edit</Link>
          <button className="btn-post-delete" onClick={() => onDelete(post)}>delete</button>
        </div>
      )}

      <div className="post-card-meta-row">
        <div className="post-card-meta-left">
          <span className="create-post-author">{displayName}</span>
          <span className="post-card-date">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      <h3 className="post-card-title">{post.title}</h3>
      <p className="post-card-preview">{post.content}</p>

      <hr className="post-detail-divider" />

      <div className="post-comment-list">
        <p className="post-comment-total">Total Comments: {comments.length}</p>
        {comments.map((c) => {
          // ป้องกัน error c.author is possibly null
          const authorObj = (typeof c.author === 'object' && c.author !== null) ? (c.author as any) : null;
          const commentAuthorId = authorObj ? authorObj._id : (typeof c.author === 'string' ? c.author : '');
          const authorName = authorObj ? authorObj.name : 'User';
          const isMe = currentUserId && commentAuthorId === currentUserId;

          return (
            <div key={c._id} className="post-comment-item">
              <div className="comment-header">
                <p className="post-comment-author">
                  {authorName} {isMe && <span className="post-comment-you">(You)</span>}
                </p>
                {isMe && (
                  <div className="comment-actions">
                    <button className="btn-comment-edit" onClick={() => onEditComment(c)}>Edit</button>
                    <button className="btn-comment-delete" onClick={() => onDeleteComment(c)}>Delete</button>
                  </div>
                )}
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="post-comment-list">
          <p className="post-comment-total">Total Comments: {comments.length}</p>
          {[...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((c) => {
            const authorName = (typeof c.author === 'object' && c.author !== null)
              ? (c.author as { name?: string }).name || 'Anonymous'
              : (c.author === currentUserId ? currentUserName : 'Anonymous');
            const isMe = (typeof c.author === 'object' && c.author !== null)
              ? (c.author as { _id?: string })._id === currentUserId
              : c.author === currentUserId;
            return (
              <div key={c._id} className="post-comment-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="post-comment-author" style={{ margin: 0 }}>{authorName}{isMe && <span className="post-comment-you"> (You)</span>}</p>
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
              <p className="post-comment-text">{c.text}</p>
            </div>
          );
        })}
      </div>

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
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <DeleteCommentAdminModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleAdminDeleteComment}
        loading={deletingComment}
      />
    </div>
  );
}