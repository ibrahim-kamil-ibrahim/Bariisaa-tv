import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

interface CreateAchievementData {
  title: string;
  description?: string;
  emoji?: string;
  iconUrl?: string;
  points?: number;
  isHidden?: boolean;
  order?: number;
}

interface CreateLeaderboardData {
  playerName: string;
  score: number;
  rank: number;
  avatarUrl?: string;
}

export async function createAchievement(data: CreateAchievementData) {
  return prisma.achievement.create({ data });
}

export async function updateAchievement(id: string, data: Partial<CreateAchievementData>) {
  const existing = await prisma.achievement.findUnique({ where: { id } });
  if (!existing) throw new AppError('Achievement not found', 404);
  return prisma.achievement.update({ where: { id }, data });
}

export async function deleteAchievement(id: string) {
  const existing = await prisma.achievement.findUnique({ where: { id } });
  if (!existing) throw new AppError('Achievement not found', 404);
  return prisma.achievement.delete({ where: { id } });
}

export async function createLeaderboardEntry(data: CreateLeaderboardData) {
  return prisma.leaderboardEntry.create({ data });
}

export async function updateLeaderboardEntry(id: string, data: Partial<CreateLeaderboardData>) {
  const existing = await prisma.leaderboardEntry.findUnique({ where: { id } });
  if (!existing) throw new AppError('Leaderboard entry not found', 404);
  return prisma.leaderboardEntry.update({ where: { id }, data });
}

export async function deleteLeaderboardEntry(id: string) {
  const existing = await prisma.leaderboardEntry.findUnique({ where: { id } });
  if (!existing) throw new AppError('Leaderboard entry not found', 404);
  return prisma.leaderboardEntry.delete({ where: { id } });
}

export async function listAchievements() {
  return prisma.achievement.findMany({
    where: { isHidden: false },
    orderBy: { order: 'asc' },
  });
}

export async function listLeaderboard() {
  return prisma.leaderboardEntry.findMany({
    orderBy: { rank: 'asc' },
    take: 50,
  });
}

/**
 * Aggregated "My Captain" profile for the Flutter captain screen.
 * Derived from the user's real habit data (no fake values):
 *  - stars    = Σ(habit.points × totalCompletions)
 *  - missions = Σ(totalCompletions)
 *  - days / streak = best streak across all user habits
 */
export async function getCaptainProfile(userId: string) {
  const userHabits = await prisma.userHabit.findMany({
    where: { userId },
    include: { habit: true },
  });

  const totalStars = userHabits.reduce(
    (sum, uh) => sum + (uh.habit.points ?? 0) * uh.totalCompletions,
    0,
  );
  const totalMissions = userHabits.reduce((sum, uh) => sum + uh.totalCompletions, 0);
  const bestStreak = userHabits.reduce((max, uh) => Math.max(max, uh.streak), 0);

  return {
    welcome: 'Set sail on a learning adventure!',
    stars: totalStars,
    days: bestStreak,
    missions: totalMissions,
    streak: bestStreak,
  };
}
