'use client';

import { useState } from 'react';
import { BlogPost } from '../../../interface';
import ModalWrapper from '../ModalWrapper';
import createComment from '@/libs/createComment';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface PostDetailModalProps {
  post: BlogPost;
  authorName?: string;
  onClose: () => void;
}

export default function PostDetailModal({ post, authorName, onClose }: PostDetailModalProps) {
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSendComment() {
    const text = comment.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await createComment(token, post._id, text);
      setComment('');
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  return (
    <ModalWrapper open onClose={onClose}>
      {/* Author + date row */}
      <div className="post-detail-meta-row">
        {authorName && (
          <span className="create-post-author">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {authorName}
          </span>
        )}
        <span className="post-detail-date">{formatDate(post.createdAt)}</span>
      </div>

      {/* Title */}
      <h3 className="post-detail-title">{post.title}</h3>

      {/* Content */}
      <p className="post-detail-content">{post.content}</p>

      <hr className="post-detail-divider" />

      {/* Comment input */}
      <div className="post-comment-box">
        <input
          className="post-comment-input"
          placeholder="Typing the comment ..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={100}
          onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
        />
        <button
          className="post-comment-send"
          onClick={handleSendComment}
          disabled={sending || !comment.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </ModalWrapper>
  );
}
