import updateBooking from '@/libs/updateBooking';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('updateBooking', () => {
  it('sends PUT request on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;

    await expect(updateBooking('token', 'b1', '2022-05-11T10:00:00')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/bookings/b1`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ bookingDate: '2022-05-11T10:00:00' }),
      })
    );
  });

  it('throws on failure with message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Update failed' }),
    }) as jest.Mock;

    await expect(updateBooking('token', 'b1', 'date')).rejects.toThrow('Update failed');
  });

  it('throws fallback when json fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error()),
    }) as jest.Mock;

    await expect(updateBooking('token', 'b1', 'date')).rejects.toThrow('Failed to update booking');
  });
});
