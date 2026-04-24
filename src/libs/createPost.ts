import { BlogPost } from '../../interface';

export default async function createPost(
  token: string,
  title: string,
  content: string,
  tags?: string[]
): Promise<BlogPost> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.msg || 'Failed to create post');
  return data.data;
}
