import userLogin from '@/libs/userLogin';

const API = 'http://localhost:5000/api/v1';
beforeAll(() => { process.env.NEXT_PUBLIC_API_BASE = API; });
afterEach(() => jest.restoreAllMocks());

describe('userLogin', () => {
  it('sends POST and returns token + user data on success', async () => {
    const mockData = { token: 'jwt123', data: { name: 'John', email: 'john@test.com', role: 'user' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const result = await userLogin('john@test.com', 'password123');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'john@test.com', password: 'password123' }),
      })
    );
  });

  it('throws with server message on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    }) as jest.Mock;

    await expect(userLogin('wrong@test.com', 'bad')).rejects.toThrow('Invalid credentials');
  });

  it('throws default message when no server message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    await expect(userLogin('a@b.com', 'x')).rejects.toThrow('Invalid email or password.');
  });
});
