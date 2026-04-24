export default async function deleteComment(
  token: string,
  blogId: string,
  commentId: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs/${blogId}/comments/${commentId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.msg || 'Failed to delete comment');
}
