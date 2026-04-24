import { BlogPostJson } from '../../interface';

export default async function getPosts(): Promise<BlogPostJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
}
