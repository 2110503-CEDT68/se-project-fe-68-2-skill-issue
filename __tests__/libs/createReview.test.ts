import createReview from '@/libs/createReview';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('createReview', () => {
  it('sends POST and returns review data on success', async () => {
    const reviewData = { _id: 'r1', rating: 5, comment: 'Great', company: 'c1', user: 'u1', createdAt: '2022-05-10' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: reviewData }),
    }) as jest.Mock;

    const result = await createReview('token', 'c1', 5, 'Great');
    expect(result).toEqual(reviewData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1/reviews`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ rating: 5, comment: 'Great' }),
      })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Review failed' }),
    }) as jest.Mock;

    await expect(createReview('token', 'c1', 3, 'ok')).rejects.toThrow('Review failed');
  });
});
