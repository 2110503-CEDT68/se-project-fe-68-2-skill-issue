import { useState, useEffect } from 'react';
import { BlogComment } from '../../interface';
import getComments from '@/libs/getComments';
import createComment from '@/libs/createComment';

export function usePostComments(postId: string, currentUserId: string, currentUserName: string) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getComments(postId).then((res) => {
      const raw = res.data || [];
      const sorted = [...raw].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setComments(sorted);
    });
  }, [postId]);

  async function handleSendComment() {
    const text = comment.trim();
    const token = localStorage.getItem('jf_token');
    if (!text || sending || !token) return;

    setSending(true);
    try {
      await createComment(token, postId, text);
      const newComment: any = {
        _id: Date.now().toString(),
        text,
        author: { _id: currentUserId, name: currentUserName },
        blog: postId,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, newComment]);
      setComment('');
    } catch (err) {
      console.error('Post failed:', err);
    } finally {
      setSending(false);
    }
  }

  return { comments, comment, setComment, sending, handleSendComment };
}
