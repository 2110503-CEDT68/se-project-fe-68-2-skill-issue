'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import createPost from '@/libs/createPost';
import '@/styles/blog.css';

export default function CreatePostPage() {
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUserName(u.name || u.email || '');
        if (!u._id) router.replace('/login');
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  async function handlePublish() {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('jf_token') || '';
      await createPost(token, title.trim(), content.trim(), []);
      router.push('/blog');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish post');
      setSubmitting(false);
    }
  }

  return (
    <div className="blog-page">
      <div className="blog-header">
        <div className="blog-header-text">
          <h1>Post Blog</h1>
          <p>Explore and exchange opinion</p>
        </div>
      </div>

      <div className="create-post-card">
        {/* Author & date row */}
        <div className="create-post-meta">
          <span className="create-post-author">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {userName}
          </span>
          <span className="create-post-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {today}
          </span>
        </div>

        {/* Inputs */}
        <input
          className="post-input"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={50}
        />

        <div className="post-textarea-wrapper">
          <textarea
            className="post-textarea"
            placeholder="Write Your Text!!!"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={50}
          />
          <span className="post-char-count">{content.length}/50</span>
        </div>

        {error && <p className="create-post-error">{error}</p>}

        {/* Actions */}
        <div className="create-post-actions">
          <button className="btn-post-cancel" onClick={() => router.push('/blog')}>
            Cancel
          </button>
          <button
            className="btn-post-publish"
            onClick={handlePublish}
            disabled={submitting || !title.trim() || !content.trim()}
          >
            {submitting ? <><span className="btn-spinner" />Publishing…</> : 'Publish'}
          </button>
        </div>
      </div>

      {/* Agreement section */}
      <div className="create-post-agreement">
        <h4>Agreement and Policy</h4>
        <ol>
          <li>Be respectful and professional at all times.</li>
          <li>Post only career-related and relevant content.</li>
          <li>Ensure information is accurate and not misleading.</li>
          <li>No spam or unauthorized advertising.</li>
          <li>Respect copyrights and give proper credit.</li>
          <li>Posts may be moderated or removed if they violate these rules.</li>
        </ol>
      </div>
    </div>
  );
}
