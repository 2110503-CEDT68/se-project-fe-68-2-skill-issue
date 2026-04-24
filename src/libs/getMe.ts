import { UserItem } from '../../interface';

export default async function getMe(
  token: string
): Promise<{ success: boolean; data: UserItem }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/auth/me`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}
