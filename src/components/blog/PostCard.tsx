'use client';

import { useState, useEffect } from 'react';
import { BlogPost, BlogComment } from '../../../interface';
import createComment from '@/libs/createComment';
import getComments from '@/libs/getComments';

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
  index: number;
  onDelete: (post: BlogPost) => void;
}

export default function PostCard({ post, currentUserId, currentUserName, index, onDelete }: PostCardProps) {
  // เช็คชื่อเจ้าของโพสต์ (ใช้ Logic เดียวกับคอมเมนต์เพื่อความชัวร์)
  const isOwner = currentUserId && (typeof post.author === 'object' ? post.author._id : post.author) === currentUserId;
  const displayName = typeof post.author === 'object' ? post.author.name : 'User';

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getComments(post._id).then(res => setComments(res.data || []));
  }, [post._id]);

  async function handleSendComment() {
    const text = comment.trim();
    const token = localStorage.getItem('jf_token');
    
    if (!text || sending || !token) {
      if (!token) console.error("No token found in localStorage");
      return;
    }

    setSending(true);
    try {
      await createComment(token, post._id, text);
      
      // ── Optimistic Update ──
      // จำลองก้อนข้อมูลให้เหมือนที่ Backend ส่งมา (มี author เป็น object)
      const newComment: any = {
        _id: Date.now().toString(),
        text,
        author: { _id: currentUserId, name: currentUserName }, 
        blog: post._id,
        createdAt: new Date().toISOString(),
      };
      
      setComments(prev => [...prev, newComment]);
      setComment('');
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="post-card" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Author + date row */}
      <div className="post-card-meta-row">
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
        {isOwner && (
          <button className="btn-post-delete" onClick={() => onDelete(post)}>Delete</button>
        )}
      </div>

      {/* Title */}
      <h3 className="post-card-title">{post.title}</h3>

      {/* Content */}
      <p className="post-card-preview">{post.content}</p>

      <hr className="post-detail-divider" />

      {/* Comment list - เพิ่มสไตล์เลื่อนได้ตรงนี้ */}
      {comments.length > 0 && (
        <div className="post-comment-list" style={{ 
          maxHeight: '150px', 
          overflowY: 'auto', 
          margin: '10px 0',
          paddingRight: '5px'
        }}>
          {comments.map((c, i) => {
            // ── Logic แสดงชื่อ ──
            // เช็คว่า c.author เป็นก้อน Object ที่มี name ไหม (กรณี Populate มาจาก Backend)
            const authorName = (typeof c.author === 'object' && c.author !== null)
              ? (c.author as any).name 
              : (c.author === currentUserId ? currentUserName : 'Anonymous');

            return (
              <div key={c._id} className="post-comment-item">
                <p className="post-comment-author">
                  comment {i + 1} : {authorName}
                </p>
                <p className="post-comment-text">{c.text}</p>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}