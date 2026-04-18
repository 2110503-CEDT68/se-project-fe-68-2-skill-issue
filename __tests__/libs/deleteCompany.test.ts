import deleteCompany from '@/libs/deleteCompany';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('deleteCompany', () => {
  it('sends DELETE request on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;

    await expect(deleteCompany('token', 'c1')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies/c1`,
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ msg: 'Forbidden' }),
    }) as jest.Mock;

    await expect(deleteCompany('token', 'c1')).rejects.toThrow('Forbidden');
  });

  it('throws fallback when json fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error()),
    }) as jest.Mock;

    await expect(deleteCompany('token', 'c1')).rejects.toThrow('Failed to delete company');
  });
});
