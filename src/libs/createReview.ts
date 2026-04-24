import { ReviewItem } from '../../interface';

export default async function createReview(
  token: string,
  companyId: string,
  rating: number,
  comment: string
): Promise<ReviewItem> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies/${companyId}/reviews`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating, comment }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.msg || 'Failed to create review');
  return data.data;
}
