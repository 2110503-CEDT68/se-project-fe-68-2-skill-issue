export default async function updatePost(token: string, postId: string, title: string, content: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs/${postId}`,
    {
      method: 'PUT', // หรือ 'PATCH' ขึ้นอยู่กับ Backend ของคุณ
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.msg || 'Failed to update post');
  }
}