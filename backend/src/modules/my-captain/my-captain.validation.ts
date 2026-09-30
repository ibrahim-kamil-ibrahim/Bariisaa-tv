import { z } from 'zod';

export const createAchievementSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  emoji: z.string().max(10).optional(),
  iconUrl: z.string().optional(),
  points: z.coerce.number().int().nonnegative().optional(),
  isHidden: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  order: z.coerce.number().int().optional(),
});

export const updateAchievementSchema = createAchievementSchema.partial();

export const createLeaderboardSchema = z.object({
  playerName: z.string().min(1).max(200),
  score: z.coerce.number().int().nonnegative(),
  rank: z.coerce.number().int().nonnegative(),
  avatarUrl: z.string().optional(),
});

export const updateLeaderboardSchema = createLeaderboardSchema.partial();
