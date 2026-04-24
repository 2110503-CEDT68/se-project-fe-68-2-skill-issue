import { ReviewJson } from '../../interface';

export default async function getReviews(companyId: string): Promise<ReviewJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies/${companyId}/reviews`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch reviews');
  return response.json();
}
