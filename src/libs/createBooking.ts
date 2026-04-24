import { BookingItem } from '../../interface';

export default async function createBooking(
  token: string,
  companyId: string,
  bookingDate: string
): Promise<{ data: BookingItem }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/companies/${companyId}/bookings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingDate }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.msg || 'Booking failed');
  return data;
}