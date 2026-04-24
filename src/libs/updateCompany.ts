import { CompanyItem } from '../../interface';

export default async function updateCompany(
  token: string,
  companyId: string,
  body: Partial<Omit<CompanyItem, '_id'>>
): Promise<{ data: CompanyItem }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies/${companyId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.msg || 'Failed to update company');
  return data;
}
