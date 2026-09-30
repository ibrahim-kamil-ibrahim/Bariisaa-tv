import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { uploadFile } from '../../utils/signedUrl';

const BCRYPT_ROUNDS = 12;

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      phoneVerified: true,
      status: true,
      preferredLanguage: true,
      createdAt: true,
      updatedAt: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { devices: true },
      },
    },
  });

  if (!user) throw new AppError('User not found', 404);

  return {
    ...user,
    activeSubscription: user.subscriptions[0] || null,
    deviceCount: user._count.devices,
    subscriptions: undefined,
    _count: undefined,
  };
}

export async function updateProfile(userId: string, data: { name?: string; preferredLanguage?: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      preferredLanguage: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function updateAvatar(
  userId: string,
  fileBuffer: Buffer,
  originalName: string,
  contentType: string
) {
  const key = await uploadFile(fileBuffer, originalName, contentType, 'avatars');

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: key },
    select: { id: true, avatarUrl: true },
  });

  return user;
}

export async function getDevices(userId: string) {
  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastActiveAt: 'desc' },
  });

  return devices;
}

export async function removeDevice(userId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId },
  });

  if (!device) throw new AppError('Device not found', 404);

  await prisma.device.delete({ where: { id: deviceId } });

  return { message: 'Device removed successfully' };
}

export async function listUsers(
  page: number,
  limit: number,
  search?: string,
  status?: string
) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        _count: {
          select: { devices: true, subscriptions: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      },
      devices: {
        orderBy: { lastActiveAt: 'desc' },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) throw new AppError('User not found', 404);

  return user;
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, status: true, updatedAt: true },
  });

  return updated;
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  await prisma.user.delete({ where: { id: userId } });

  return { message: 'User deleted successfully' };
}

export async function bulkDeleteUsers(ids: string[]) {
  if (!ids.length) throw new AppError('No users selected', 400);
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return { deleted: ids.length };
}

export async function bulkUpdateStatus(ids: string[], status: UserStatus) {
  if (!ids.length) throw new AppError('No users selected', 400);
  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { status } });
  return { updated: ids.length };
}

export async function adminResetPassword(userId: string, newPassword?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const password = newPassword || crypto.randomBytes(8).toString('base64url');
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { tempPassword: password };
}
