import createCompany from '@/libs/createCompany';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('createCompany', () => {
  const body = { name: 'Test Co', address: '123 St', website: '', description: '', telephone_number: '' };

  it('sends POST and returns company data on success', async () => {
    const mockData = { data: { _id: 'c1', ...body } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await createCompany('token', body);
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/companies`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws on failure with message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Duplicate' }),
    }) as jest.Mock;

    await expect(createCompany('token', body)).rejects.toThrow('Duplicate');
  });

  it('throws with msg field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ msg: 'Error msg' }),
    }) as jest.Mock;

    await expect(createCompany('token', body)).rejects.toThrow('Error msg');
  });
});
