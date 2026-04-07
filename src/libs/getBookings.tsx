import { BookingJson } from '../../interface';

export default async function getBookings(token: string): Promise<BookingJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/bookings`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}