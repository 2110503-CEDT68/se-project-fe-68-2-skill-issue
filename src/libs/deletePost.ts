export default async function deletePost(token: string, postId: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/posts/${postId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.msg || 'Failed to delete post');
  }
}
