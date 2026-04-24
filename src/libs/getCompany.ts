import { CompanyItem } from '../../interface';

export default async function getCompany(id: string): Promise<{ success: boolean; data: CompanyItem }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jf_token') || '' : '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies/${id}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch company');
  return response.json();
}