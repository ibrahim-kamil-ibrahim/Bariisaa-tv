import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

interface CreateHealthTipData {
  title: string;
  content: string;
  emoji?: string;
  category?: string;
  order?: number;
}

interface CreateDoctorProfileData {
  name: string;
  specialty: string;
  bio?: string;
  photoUrl?: string;
  available?: boolean;
  order?: number;
}

export async function createHealthTip(data: CreateHealthTipData) {
  return prisma.healthTip.create({ data });
}

export async function updateHealthTip(id: string, data: Partial<CreateHealthTipData>) {
  const existing = await prisma.healthTip.findUnique({ where: { id } });
  if (!existing) throw new AppError('Health tip not found', 404);
  return prisma.healthTip.update({ where: { id }, data });
}

export async function deleteHealthTip(id: string) {
  const existing = await prisma.healthTip.findUnique({ where: { id } });
  if (!existing) throw new AppError('Health tip not found', 404);
  return prisma.healthTip.delete({ where: { id } });
}

export async function createDoctorProfile(data: CreateDoctorProfileData) {
  return prisma.doctorProfile.create({ data });
}

export async function updateDoctorProfile(id: string, data: Partial<CreateDoctorProfileData>) {
  const existing = await prisma.doctorProfile.findUnique({ where: { id } });
  if (!existing) throw new AppError('Doctor profile not found', 404);
  return prisma.doctorProfile.update({ where: { id }, data });
}

export async function deleteDoctorProfile(id: string) {
  const existing = await prisma.doctorProfile.findUnique({ where: { id } });
  if (!existing) throw new AppError('Doctor profile not found', 404);
  return prisma.doctorProfile.delete({ where: { id } });
}

export async function listHealthTips() {
  return prisma.healthTip.findMany({ orderBy: { order: 'asc' } });
}

export async function listDoctorProfiles() {
  return prisma.doctorProfile.findMany({
    where: { available: true },
    orderBy: { order: 'asc' },
  });
}
