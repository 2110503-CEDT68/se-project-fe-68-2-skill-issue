import { BlogCommentJson } from '../../interface';

export default async function getComments(blogId: string): Promise<BlogCommentJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/blogs/${blogId}/comments`,
    { cache: 'no-store' }
  );
  const data = await response.json().catch(() => ({ success: false, data: [] }));
  if (!response.ok) return { success: false, data: [] };
  return data;
}
