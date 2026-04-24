export default async function createComment(
  token: string,
  blogId: string,
  text: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs/${blogId}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.msg || 'Failed to post comment');
}
