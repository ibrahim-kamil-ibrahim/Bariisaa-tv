import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/environment';
import * as r2 from '../../services/storage/r2.service';
import { checkSubscriptionActive } from '../subscriptions/subscription.service';

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/mp2t',
  'video/ogg',
  'video/x-matroska',
];
const ALLOWED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function getVideoOrThrow(mediaId: string) {
  const record = await prisma.mediaFile.findUnique({ where: { id: mediaId } });
  if (!record || record.deletedAt) throw new AppError('Video not found', 404);
  if (record.type !== 'video') throw new AppError('Media is not a video', 400);
  return record;
}

/** Public URL when R2_PUBLIC_URL is set, otherwise a short-lived signed URL. */
async function resolveAccessUrl(key: string): Promise<{ url: string; expiresIn: number | null }> {
  if (env.R2_PUBLIC_URL) return { url: r2.getPublicUrl(key), expiresIn: null };
  return { url: await r2.createDownloadUrl(key), expiresIn: r2.R2_DOWNLOAD_URL_EXPIRY };
}

/**
 * STEP 2/3 of the direct-upload flow: create the DB record + a scoped,
 * expiring presigned PUT URL. The client uploads straight to R2 and then
 * calls `completeVideoUpload`. Video bytes never touch this server.
 */
export async function requestVideoUploadUrl(
  data: { fileName: string; contentType: string; fileSize: number; bookId?: string },
  userId: string
) {
  if (!ALLOWED_VIDEO_TYPES.includes(data.contentType)) {
    throw new AppError(`Unsupported video type: ${data.contentType}`, 400);
  }
  if (!data.fileSize || data.fileSize <= 0) {
    throw new AppError('fileSize is required and must be positive', 400);
  }
  if (data.fileSize > MAX_VIDEO_SIZE) {
    throw new AppError('Video exceeds the maximum allowed size (2 GB)', 400);
  }

  const record = await prisma.mediaFile.create({
    data: {
      name: data.fileName,
      originalName: data.fileName,
      type: 'video',
      mimeType: data.contentType,
      size: data.fileSize,
      url: '',
      bookId: data.bookId || null,
      storageProvider: 'R2',
      uploadStatus: 'PENDING',
      visibility: 'PREMIUM',
      createdBy: userId,
    },
  });

  const objectKey = r2.generateVideoKey(data.bookId || 'unassigned', record.id, data.fileName, data.contentType);
  const uploadUrl = await r2.createUploadUrl(objectKey, data.contentType);

  await prisma.mediaFile.update({
    where: { id: record.id },
    data: { storageKey: objectKey, uploadStatus: 'UPLOADING' },
  });

  console.log(`[R2] upload initiated mediaId=${record.id} size=${data.fileSize}`);
  return { mediaId: record.id, objectKey, uploadUrl, expiresIn: r2.R2_UPLOAD_URL_EXPIRY };
}

/** STEP 5: verify the object actually landed in R2, then mark COMPLETED. */
export async function completeVideoUpload(mediaId: string) {
  const record = await getVideoOrThrow(mediaId);
  if (!record.storageKey) throw new AppError('Video has no storage key', 400);

  const exists = await r2.objectExists(record.storageKey);
  if (!exists) {
    await prisma.mediaFile.update({ where: { id: mediaId }, data: { uploadStatus: 'FAILED' } });
    throw new AppError('Uploaded object not found in R2 — the upload may not have completed', 400);
  }

  let url = '';
  if (record.visibility === 'PUBLIC' && env.R2_PUBLIC_URL) {
    url = r2.getPublicUrl(record.storageKey);
  }

  const updated = await prisma.mediaFile.update({
    where: { id: mediaId },
    data: { uploadStatus: 'COMPLETED', uploadedAt: new Date(), url },
  });

  console.log(`[R2] upload completed mediaId=${mediaId}`);
  return updated;
}

/**
 * Secure playback: authenticate → check access → return a short-lived signed
 * URL. PREMIUM videos require an active subscription (or super_admin).
 * Video bytes stream directly from R2 — never proxied through this server.
 */
export async function getVideoPlaybackUrl(mediaId: string, userId: string, roles: string[]) {
  const record = await getVideoOrThrow(mediaId);
  if (record.uploadStatus !== 'COMPLETED') throw new AppError('Video is not ready for playback', 409);
  if (!record.storageKey) throw new AppError('Video has no storage key', 400);

  let access: { url: string; expiresIn: number | null };
  let thumbnailUrl: string | null = null;

  if (record.visibility === 'PREMIUM') {
    const isAdmin = roles.includes('super_admin');
    if (!isAdmin && !(await checkSubscriptionActive(userId))) {
      throw new AppError('Premium subscription required to watch this video', 403);
    }
    access = { url: await r2.createDownloadUrl(record.storageKey), expiresIn: r2.R2_DOWNLOAD_URL_EXPIRY };
    if (record.thumbnailKey) thumbnailUrl = await r2.createDownloadUrl(record.thumbnailKey);
  } else {
    access = await resolveAccessUrl(record.storageKey);
    if (record.thumbnailKey) thumbnailUrl = (await resolveAccessUrl(record.thumbnailKey)).url;
  }

  console.log(`[R2] video accessed mediaId=${mediaId} visibility=${record.visibility} by=${userId}`);
  return { url: access.url, expiresIn: access.expiresIn, thumbnailUrl, durationSeconds: record.durationSeconds };
}

export async function getVideo(mediaId: string) {
  const record = await getVideoOrThrow(mediaId);
  let thumbnailUrl: string | null = null;
  if (record.thumbnailKey) {
    try {
      thumbnailUrl = (await resolveAccessUrl(record.thumbnailKey)).url;
    } catch {
      thumbnailUrl = null;
    }
  }
  return { ...record, thumbnailUrl };
}

/** Separate thumbnail upload — same direct-to-R2 flow. */
export async function requestThumbnailUploadUrl(
  mediaId: string,
  data: { fileName: string; contentType: string }
) {
  const record = await getVideoOrThrow(mediaId);
  if (!ALLOWED_THUMBNAIL_TYPES.includes(data.contentType)) {
    throw new AppError(`Unsupported thumbnail type: ${data.contentType}`, 400);
  }

  const thumbnailKey = r2.generateThumbnailKey(record.bookId || 'unassigned', record.id, data.fileName);
  const uploadUrl = await r2.createUploadUrl(thumbnailKey, data.contentType);

  await prisma.mediaFile.update({ where: { id: mediaId }, data: { thumbnailKey } });

  console.log(`[R2] thumbnail upload initiated mediaId=${mediaId}`);
  return { mediaId, objectKey: thumbnailKey, uploadUrl, expiresIn: r2.R2_UPLOAD_URL_EXPIRY };
}

/** Delete the R2 object(s) + soft-delete metadata (no orphaned files). */
export async function deleteVideo(mediaId: string) {
  const record = await getVideoOrThrow(mediaId);

  if (record.storageKey) {
    try {
      await r2.deleteObject(record.storageKey);
    } catch (e) {
      console.error('[R2] delete video object failed:', (e as Error).message);
    }
  }
  if (record.thumbnailKey) {
    try {
      await r2.deleteObject(record.thumbnailKey);
    } catch (e) {
      console.error('[R2] delete thumbnail object failed:', (e as Error).message);
    }
  }

  await prisma.mediaFile.update({
    where: { id: mediaId },
    data: { deletedAt: new Date(), uploadStatus: 'DELETED' },
  });

  console.log(`[R2] video deleted mediaId=${mediaId}`);
}
