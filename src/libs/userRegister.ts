export default async function userRegister(
  name: string,
  email: string,
  telephone_number: string,
  password: string
): Promise<{ token: string; data: { name: string; email: string; role: string } }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, telephone_number, password, role: 'user' }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed.');
  return data;
}
