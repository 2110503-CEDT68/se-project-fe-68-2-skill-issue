import getAllReviews from '@/libs/getAllReviews';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('getAllReviews', () => {
  it('returns reviews JSON on success with auth token', async () => {
    const mockData = { success: true, data: [{ _id: 'r1', rating: 4, comment: 'Nice', company: 'c1', user: 'u1', createdAt: '2022-05-10' }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await getAllReviews('token', 'c1');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1/reviews`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(getAllReviews('token', 'c1')).rejects.toThrow('Failed to fetch reviews');
  });
});
