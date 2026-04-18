import getBookings from '@/libs/getBookings';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('getBookings', () => {
  it('returns bookings JSON on success', async () => {
    const mockData = { success: true, count: 1, data: [{ _id: 'b1', bookingDate: '2022-05-10', company: { _id: 'c1', name: 'Co' } }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await getBookings('token');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/bookings`,
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer token' }) })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(getBookings('token')).rejects.toThrow('Failed to fetch bookings');
  });
});
