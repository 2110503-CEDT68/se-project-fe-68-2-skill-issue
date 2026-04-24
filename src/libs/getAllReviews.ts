import { ReviewJson } from '../../interface';

export default async function getAllReviews(
  token: string,
  companyId: string
): Promise<ReviewJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies/${companyId}/reviews`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch reviews');
  return response.json();
}
