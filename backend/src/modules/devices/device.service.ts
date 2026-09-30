import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const MAX_DEVICES = 5;

export async function registerDevice(
  userId: string,
  data: {
    deviceUid: string;
    deviceName: string;
    platform: string;
    osVersion?: string;
    fcmToken?: string;
  }
) {
  const existing = await prisma.device.findUnique({
    where: { userId_deviceUid: { userId, deviceUid: data.deviceUid } },
  });

  if (existing) {
    const updated = await prisma.device.update({
      where: { id: existing.id },
      data: {
        deviceName: data.deviceName,
        platform: data.platform as any,
        osVersion: data.osVersion,
        fcmToken: data.fcmToken,
        lastActiveAt: new Date(),
      },
    });
    return updated;
  }

  const count = await prisma.device.count({ where: { userId } });
  if (count >= MAX_DEVICES) {
    throw new AppError(`Device limit of ${MAX_DEVICES} reached. Remove a device first.`, 400);
  }

  const device = await prisma.device.create({
    data: {
      userId,
      deviceUid: data.deviceUid,
      deviceName: data.deviceName,
      platform: data.platform as any,
      osVersion: data.osVersion,
      fcmToken: data.fcmToken,
      lastActiveAt: new Date(),
    },
  });

  return device;
}

export async function listDevices(userId: string) {
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

  await prisma.device.delete({
    where: { id: deviceId },
  });

  return { message: 'Device removed' };
}

export async function updateFcmToken(userId: string, deviceUid: string, fcmToken: string) {
  const device = await prisma.device.findUnique({
    where: { userId_deviceUid: { userId, deviceUid } },
  });

  if (!device) throw new AppError('Device not found', 404);

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: { fcmToken, lastActiveAt: new Date() },
  });

  return updated;
}

export async function getDeviceCount(userId: string) {
  const count = await prisma.device.count({ where: { userId } });
  return { count };
}
