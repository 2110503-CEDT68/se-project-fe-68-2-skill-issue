export default async function userLogin(
  email: string,
  password: string
): Promise<{ token: string; data: { name: string; email: string; role: string } }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invalid email or password.');
  return data;
}
