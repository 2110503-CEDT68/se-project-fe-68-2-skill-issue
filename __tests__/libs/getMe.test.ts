import getMe from '@/libs/getMe';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('getMe', () => {
  it('returns user data on success', async () => {
    const mockData = { success: true, data: { _id: 'u1', name: 'John', email: 'john@test.com', role: 'user' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await getMe('token');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auth/me`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(getMe('token')).rejects.toThrow('Failed to fetch user');
  });
});
