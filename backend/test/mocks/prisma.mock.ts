/* eslint-disable @typescript-eslint/no-explicit-any */

const createMockModel = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
});

export const mockPrisma: any = {
  user: createMockModel(),
  refreshToken: createMockModel(),
  emailVerification: createMockModel(),
  passwordReset: createMockModel(),
  otpCode: createMockModel(),
  book: createMockModel(),
  mediaFile: createMockModel(),
  subscription: createMockModel(),
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));
