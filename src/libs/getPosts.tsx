import { BlogPostJson } from '../../interface';

export default async function getPosts(page = 1, limit = 6, search = '') {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs?${params}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
  // shape: { success, count, pagination: { page, limit, total, totalPages, next?, prev? }, data }
}