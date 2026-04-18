import userRegister from '@/libs/userRegister';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('userRegister', () => {
  it('sends POST and returns token + user data on success', async () => {
    const mockData = { token: 'jwt456', data: { name: 'Jane', email: 'jane@test.com', role: 'user' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await userRegister('Jane', 'jane@test.com', '0812345678', 'pass123');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auth/register`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane',
          email: 'jane@test.com',
          telephone_number: '0812345678',
          password: 'pass123',
          role: 'user',
        }),
      })
    );
  });

  it('throws with server message on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Email already exists' }),
    }) as jest.Mock;

    await expect(userRegister('A', 'a@b.com', '0', 'p')).rejects.toThrow('Email already exists');
  });

  it('throws default message when no server message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    await expect(userRegister('A', 'a@b.com', '0', 'p')).rejects.toThrow('Registration failed.');
  });
});
