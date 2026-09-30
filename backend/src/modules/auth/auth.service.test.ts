import { mockPrisma } from '../../../test/mocks/prisma.mock';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/sms', () => ({
  sendOtpSms: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetSms: jest.fn().mockResolvedValue(undefined),
}));

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as authService from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guest signup', () => {
    it('should create a new user and return tokens', async () => {
      const dto = { email: 'new@naik.com', password: 'StrongPass1!', name: 'New User' };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: null,
        name: dto.name,
        emailVerified: false,
        phoneVerified: false,
        profileData: {},
        createdAt: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.signupAsGuest(dto.name, {});

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', 'user-1');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const password = 'StrongPass1!';
      const passwordHash = await bcrypt.hash(password, 10);

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@naik.com',
        passwordHash,
        status: 'ACTIVE',
        name: 'User',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.login('user@naik.com', password, true, '127.0.0.1');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw for invalid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.login('user@naik.com', 'wrong', true, '127.0.0.1')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should rotate tokens for valid refresh token', async () => {
      const refreshTokenValue = jwt.sign(
        { userId: 'user-1', familyId: 'family-1', jti: 'jti-1' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '1d' }
      );

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: refreshTokenValue,
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: { status: 'ACTIVE' },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.refreshAccessToken(refreshTokenValue);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('upgradePassword', () => {
    it('should set password when email is verified', async () => {
      const passwordHash = await bcrypt.hash('NewPass1!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        emailVerified: true,
        passwordHash: null,
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await authService.upgradePassword('user-1', 'NewPass1!');

      expect(result).toHaveProperty('message', 'Password set successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ passwordHash: expect.any(String) }),
        })
      );
    });

    it('should throw when neither email nor phone is verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        emailVerified: false,
        phoneVerified: false,
        passwordHash: null,
      });

      await expect(authService.upgradePassword('user-1', 'NewPass1!')).rejects.toThrow(
        'Email or phone must be verified before setting a password'
      );
    });

    it('should throw when password already set (idempotency)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        emailVerified: true,
        passwordHash: 'existing-hash',
      });

      await expect(authService.upgradePassword('user-1', 'NewPass1!')).rejects.toThrow(
        'Password already set'
      );
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.upgradePassword('user-1', 'NewPass1!')).rejects.toThrow(
        'User not found'
      );
    });
  });
});
