import { z } from 'zod';

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

export const videoUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  fileSize: z.number().int().positive().max(MAX_VIDEO_SIZE),
  bookId: z.string().optional(),
});

export const thumbnailUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
});
