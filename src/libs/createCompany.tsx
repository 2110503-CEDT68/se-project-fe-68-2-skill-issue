import { CompanyItem } from '../../interface';

export default async function createCompany(
  token: string,
  body: Omit<CompanyItem, '_id'>
): Promise<{ data: CompanyItem }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.msg || 'Failed to create company');
  return data;
}
