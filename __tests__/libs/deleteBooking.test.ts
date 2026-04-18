import deleteBooking from '@/libs/deleteBooking';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('deleteBooking', () => {
  it('sends DELETE request on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;

    await expect(deleteBooking('token', 'b1')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/bookings/b1`,
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws on failure with message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Not found' }),
    }) as jest.Mock;

    await expect(deleteBooking('token', 'b1')).rejects.toThrow('Not found');
  });

  it('throws fallback error if json parsing fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('parse error')),
    }) as jest.Mock;

    await expect(deleteBooking('token', 'b1')).rejects.toThrow('Failed to delete booking');
  });
});
