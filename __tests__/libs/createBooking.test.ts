import createBooking from '@/libs/createBooking';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_BASE = API;
});

afterEach(() => jest.restoreAllMocks());

describe('createBooking', () => {
  it('sends POST and returns booking data on success', async () => {
    const mockData = { data: { _id: 'b1', bookingDate: '2022-05-10T09:00:00', company: { _id: 'c1', name: 'Test' }, user: { _id: 'u1', name: 'User' } } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await createBooking('token123', 'c1', '2022-05-10T09:00:00');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1/bookings`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token123' }),
        body: JSON.stringify({ bookingDate: '2022-05-10T09:00:00' }),
      })
    );
  });

  it('throws error on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Booking failed' }),
    }) as jest.Mock;

    await expect(createBooking('token', 'c1', 'date')).rejects.toThrow('Booking failed');
  });

  it('uses fallback error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    await expect(createBooking('token', 'c1', 'date')).rejects.toThrow('Booking failed');
  });
});
