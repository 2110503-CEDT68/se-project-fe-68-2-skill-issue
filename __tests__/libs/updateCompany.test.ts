import updateCompany from '@/libs/updateCompany';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('updateCompany', () => {
  it('sends PUT and returns updated company on success', async () => {
    const mockData = { data: { _id: 'c1', name: 'Updated Co' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await updateCompany('token', 'c1', { name: 'Updated Co' });
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1`,
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    }) as jest.Mock;

    await expect(updateCompany('token', 'c1', { name: 'X' })).rejects.toThrow('Forbidden');
  });
});
