import getCompany from '@/libs/getCompany';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('getCompany', () => {
  it('returns single company on success', async () => {
    const mockData = { success: true, data: { _id: 'c1', name: 'Company A' } };
    // Mock localStorage
    const getItemMock = jest.fn().mockReturnValue('token123');
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: getItemMock, setItem: jest.fn(), removeItem: jest.fn() },
      writable: true,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await getCompany('c1');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(getCompany('c1')).rejects.toThrow('Failed to fetch company');
  });
});
