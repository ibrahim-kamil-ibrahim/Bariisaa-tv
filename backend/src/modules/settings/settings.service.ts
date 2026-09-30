import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function getAllSettings() {
  const settings = await prisma.appSetting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  });

  const grouped: Record<string, Record<string, { value: string; type: string; label: string | null }>> = {};

  for (const s of settings) {
    if (!grouped[s.group]) grouped[s.group] = {};
    grouped[s.group][s.key] = {
      value: s.value,
      type: s.type,
      label: s.label,
    };
  }

  return grouped;
}

export async function updateSetting(key: string, value: string) {
  const existing = await prisma.appSetting.findUnique({ where: { key } });
  if (!existing) {
    throw new AppError(`Setting "${key}" not found`, 404);
  }
  return prisma.appSetting.update({
    where: { key },
    data: { value },
  });
}

export async function updateSettings(data: Record<string, string>) {
  const updates = Object.entries(data).map(([key, value]) =>
    prisma.appSetting.update({
      where: { key },
      data: { value },
    })
  );
  return prisma.$transaction(updates);
}
