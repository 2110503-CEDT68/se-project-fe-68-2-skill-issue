export default async function updateBooking(
  token: string,
  bookingId: string,
  bookingDate: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/bookings/${bookingId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingDate }),
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.msg || 'Failed to update booking');
  }
}