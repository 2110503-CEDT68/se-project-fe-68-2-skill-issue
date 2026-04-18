import getReviews from '@/libs/getReviews';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('getReviews', () => {
  it('returns reviews JSON on success', async () => {
    const mockData = { success: true, data: [{ _id: 'r1', rating: 5, comment: 'Good', company: 'c1', user: 'u1', createdAt: '2022-05-10' }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await getReviews('c1');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1/reviews`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(getReviews('c1')).rejects.toThrow('Failed to fetch reviews');
  });
});
