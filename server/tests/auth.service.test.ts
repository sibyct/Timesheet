import { AuthService } from '../services/auth.service';

// Mock the User model
jest.mock('../models/user.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

// Mock the auth middleware (generateToken)
jest.mock('../middleware/auth.middleware', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

import User from '../models/user.model';

const mockUser = {
  userId: 1,
  username: 'admin',
  role: 0,
  firstName: 'Admin',
  password: 'hashed',
  comparePassword: jest.fn(),
  save: jest.fn(),
};

describe('AuthService.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns token and role on valid credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    mockUser.comparePassword.mockResolvedValue(true);

    const result = await AuthService.login('admin', 'admin123');

    expect(result.token).toBe('mock-jwt-token');
    expect(result.role).toBe(0);
  });

  it('throws 401 when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(AuthService.login('nobody', 'pass')).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('throws 401 when password does not match', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    mockUser.comparePassword.mockResolvedValue(false);

    await expect(AuthService.login('admin', 'wrongpass')).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });
});

describe('AuthService.changePassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves new password for existing user', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    mockUser.save.mockResolvedValue(undefined);

    await expect(AuthService.changePassword('admin', 'newpass123')).resolves.toBeUndefined();
    expect(mockUser.password).toBe('newpass123');
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(AuthService.changePassword('nobody', 'newpass')).rejects.toMatchObject({
      message: 'User not found',
      status: 404,
    });
  });
});
