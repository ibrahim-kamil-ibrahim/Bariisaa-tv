import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

interface CreateHabitData {
  title: string;
  description?: string;
  emoji?: string;
  category?: string;
  points?: number;
  isActive?: boolean;
  order?: number;
}

interface HabitQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export async function createHabit(data: CreateHabitData) {
  return prisma.habit.create({ data });
}

export async function updateHabit(id: string, data: Partial<CreateHabitData>) {
  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) throw new AppError('Habit not found', 404);
  return prisma.habit.update({ where: { id }, data });
}

export async function deleteHabit(id: string) {
  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) throw new AppError('Habit not found', 404);
  return prisma.habit.delete({ where: { id } });
}

export async function getHabitById(id: string) {
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) throw new AppError('Habit not found', 404);
  return habit;
}

export async function listHabits(query: HabitQuery) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.category) where.category = query.category;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

  const [habits, total] = await Promise.all([
    prisma.habit.findMany({ where, skip, take: limit, orderBy: { order: 'asc' } }),
    prisma.habit.count({ where }),
  ]);
  return { habits, total };
}

export async function completeHabit(userId: string, habitId: string, dateStr?: string) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) throw new AppError('Habit not found', 404);
  if (!habit.isActive) throw new AppError('Habit is inactive', 400);

  const date = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(date.getTime())) throw new AppError('Invalid date', 400);
  date.setHours(0, 0, 0, 0);

  // "yesterday" relative to the completion date (not the real current date).
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);

  // Atomic create — dedup relies on @@unique([userId, habitId, date]); a
  // concurrent duplicate surfaces as P2002 and is mapped to a clean 409.
  let progress;
  try {
    progress = await prisma.habitProgress.create({ data: { userId, habitId, date } });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === 'P2002') throw new AppError('Already completed for this date', 409);
    throw e;
  }

  const [prevProgress, userHabit] = await Promise.all([
    prisma.habitProgress.findFirst({ where: { userId, habitId, date: yesterday }, orderBy: { date: 'desc' } }),
    prisma.userHabit.findUnique({ where: { userId_habitId: { userId, habitId } } }),
  ]);

  const oldStreak = userHabit?.streak ?? 0;
  const newStreak = prevProgress ? oldStreak + 1 : 1;
  const bestStreak = Math.max(newStreak, userHabit?.bestStreak ?? 0);

  await prisma.userHabit.upsert({
    where: { userId_habitId: { userId, habitId } },
    update: { streak: newStreak, bestStreak, totalCompletions: { increment: 1 } },
    create: { userId, habitId, streak: newStreak, bestStreak, totalCompletions: 1 },
  });

  return progress;
}

export async function getUserStats(userId: string) {
  const userHabits = await prisma.userHabit.findMany({
    where: { userId },
    include: { habit: true },
    orderBy: { startedAt: 'desc' },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

  const [weeklyProgress, monthlyProgress] = await Promise.all([
    prisma.habitProgress.findMany({ where: { userId, date: { gte: weekAgo } }, orderBy: { date: 'desc' } }),
    prisma.habitProgress.findMany({ where: { userId, date: { gte: monthAgo } }, orderBy: { date: 'desc' } }),
  ]);

  return { userHabits, weeklyProgress, monthlyProgress };
}

export async function getUserProgress(userId: string, query: { page?: number; limit?: number; habitId?: string }) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 30;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (query.habitId) where.habitId = query.habitId;

  const [progress, total] = await Promise.all([
    prisma.habitProgress.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.habitProgress.count({ where }),
  ]);
  return { progress, total };
}
