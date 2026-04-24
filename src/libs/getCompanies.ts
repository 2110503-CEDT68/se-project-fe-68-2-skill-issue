import { CompanyJson } from '../../interface';

export default async function getCompanies(token: string): Promise<CompanyJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) throw new Error('Failed to fetch companies');
  return response.json();
}