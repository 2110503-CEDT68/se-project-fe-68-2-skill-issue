'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { BlogPost } from 'interface';
import getPost from '@/libs/getPost';
import editPost from '@/libs/editPost';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/blog.css';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [userName, setUserName] = useState('');

  const { toast, showToast } = useToast();

  // Check user and load post
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u._id || '');
        setUserName(u.name || u.email || '');
        if (!u._id) router.replace('/login');
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  // Load post data
  useEffect(() => {
    if (!postId) return;
    
    const loadPost = async () => {
      setLoading(true);
      try {
        const data = await getPost(postId);
        if (!data) {
          setError('Post not found');
          setLoading(false);
          return;
        }
        
        // Check if user is the owner
        const authorId = typeof data.author === 'object' ? data.author._id : data.author;
        if (authorId !== currentUserId) {
          showToast('❌ Not authorized to edit this post', 'error');
          router.push('/blog');
          return;
        }

        setPost(data);
        setTitle(data.title);
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      loadPost();
    }
  }, [postId, currentUserId, router, showToast]);

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  async function handleUpdate() {
    if (!title.trim() || !content.trim() || !post) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('jf_token') || '';
      await editPost(token, post._id, title.trim(), content.trim());
      router.push(`/blog/${post._id}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update post';
      setError(errMsg);
      showToast(`❌ ${errMsg}`, 'error');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="blog-page">
        <div className="post-skeleton" style={{ height: 220, marginBottom: 16 }} />
        <div className="post-skeleton" style={{ height: 80 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-page">
        <Link href="/blog" className="blog-back-link">
          ← Back to Blog Feed
        </Link>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#c0392b' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      {/* Back link */}
      <Link href={`/blog/${postId}`} className="blog-back-link">
        ← Back
      </Link>

      <div className="blog-header">
        <div className="blog-header-text">
          <h1>Edit Blog Post</h1>
          <p>Update your post</p>
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

        {error && (
          <p className="create-post-error">{error}</p>
        )}

        {/* Buttons */}
        <div className="create-post-actions">
          <button
            className="btn-post-cancel"
            onClick={() => router.push(`/blog/${postId}`)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-post-publish"
            onClick={handleUpdate}
            disabled={submitting || !title.trim() || !content.trim()}
          >
            {submitting ? 'Updating...' : 'Update Post'}
          </button>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
