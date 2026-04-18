import getCompanies from '@/libs/getCompanies';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('getCompanies', () => {
  it('returns companies JSON on success', async () => {
    const mockData = { success: true, count: 2, data: [{ _id: 'c1', name: 'A' }, { _id: 'c2', name: 'B' }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await getCompanies('token');
    expect(result).toEqual(mockData);
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(getCompanies('token')).rejects.toThrow('Failed to fetch companies');
  });
});
