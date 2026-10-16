import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/environment';
import * as r2 from '../../services/storage/r2.service';
import { checkSubscriptionActive } from '../subscriptions/subscription.service';
import { UPLOADS_DIR } from '../../utils/localUpload';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
  'video/mp2t',
  'video/ogg',
  'video/x-matroska',
  'video/3gpp',
  'video/3gpp2',
  'video/x-m4v',
  'video/mpeg',
  'video/x-flv',
  'video/x-ms-wmv',
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

// ── local disk fallback (R2 not configured) ────────────────────────────────
// When the R2 credentials are missing/placeholder, videos are streamed to
// `uploads/videos/...` by this server instead of Cloudflare, and served by
// the existing `express.static('/uploads')` mount. The client flow is
// identical: upload-url → PUT bytes → complete.

function localFilePath(storageKey: string): string {
  return path.join(UPLOADS_DIR, storageKey);
}

function localPublicUrl(storageKey: string): string {
  return `${env.APP_URL.replace(/\/$/, '')}/uploads/${storageKey}`;
}

/** Streaming PUT of raw video bytes to the local uploads directory. */
export async function uploadVideoLocal(
  mediaId: string,
  body: Readable,
  contentType: string,
  contentLength?: number
) {
  const record = await getVideoOrThrow(mediaId);
  if (record.storageProvider !== 'LOCAL') throw new AppError('This video uses cloud storage', 400);
  if (record.uploadStatus === 'COMPLETED') throw new AppError('Video already uploaded', 409);
  const normalizedType = (contentType || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_VIDEO_TYPES.includes(normalizedType)) {
    throw new AppError(`Unsupported video type: ${normalizedType || 'unknown'}`, 400);
  }
  if (contentLength && contentLength > MAX_VIDEO_SIZE) {
    throw new AppError('Video exceeds the maximum allowed size (2 GB)', 400);
  }
  if (!record.storageKey) throw new AppError('Video has no storage key', 400);

  const filePath = localFilePath(record.storageKey);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const partPath = `${filePath}.part`;

  let received = 0;
  let settled = false;
  await new Promise<void>((resolve, reject) => {
    const ws = fs.createWriteStream(partPath);
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      body.destroy();
      ws.destroy();
      reject(err);
    };
    body.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_VIDEO_SIZE) {
        fail(new AppError('Video exceeds the maximum allowed size (2 GB)', 400));
      }
    });
    body.on('error', fail);
    ws.on('error', fail);
    ws.on('finish', () => {
      if (settled) return;
      settled = true;
      resolve();
    });
    body.pipe(ws);
  });

  await fsp.rename(partPath, filePath);
  await prisma.mediaFile.update({
    where: { id: mediaId },
    data: { size: received, uploadStatus: 'UPLOADING' },
  });
  console.log(`[LOCAL] upload received mediaId=${mediaId} size=${received}`);
  return { mediaId, size: received };
}

/**
 * STEP 2/3 of the direct-upload flow: create the DB record + a scoped,
 * expiring presigned PUT URL. The client uploads straight to R2 and then
 * calls `completeVideoUpload`. Video bytes never touch this server.
 *
 * When R2 is not configured (missing/placeholder credentials), falls back to
 * `mode: 'local'`: the client PUTs the bytes to this server instead, and the
 * file is stored under `uploads/videos/...`.
 */
export async function requestVideoUploadUrl(
  data: {
    fileName: string;
    contentType: string;
    fileSize: number;
    bookId?: string;
    storyId?: string;
    visibility?: 'PUBLIC' | 'PREMIUM';
  },
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

  const useR2 = r2.isR2Configured();
  const record = await prisma.mediaFile.create({
    data: {
      name: data.fileName,
      originalName: data.fileName,
      type: 'video',
      mimeType: data.contentType,
      size: data.fileSize,
      url: '',
      bookId: data.bookId || null,
      storyId: data.storyId || null,
      storageProvider: useR2 ? 'R2' : 'LOCAL',
      uploadStatus: 'PENDING',
      // Defaults to PREMIUM (the historical behaviour); callers that know the
      // owning content's tier pass PUBLIC/PREMIUM explicitly.
      visibility: data.visibility || 'PREMIUM',
      createdBy: userId,
    },
  });

  // Object-key scope: the owning content id, so storage keys stay organised.
  const scope = data.storyId || data.bookId || 'unassigned';
  const objectKey = r2.generateVideoKey(scope, record.id, data.fileName, data.contentType);

  if (!useR2) {
    await prisma.mediaFile.update({
      where: { id: record.id },
      data: { storageKey: objectKey, uploadStatus: 'UPLOADING' },
    });
    console.log(`[LOCAL] upload requested mediaId=${record.id} size=${data.fileSize}`);
    return { mediaId: record.id, objectKey, uploadUrl: null as string | null, expiresIn: null as number | null, mode: 'local' as const };
  }

  const uploadUrl = await r2.createUploadUrl(objectKey, data.contentType);

  await prisma.mediaFile.update({
    where: { id: record.id },
    data: { storageKey: objectKey, uploadStatus: 'UPLOADING' },
  });

  console.log(`[R2] upload initiated mediaId=${record.id} size=${data.fileSize}`);
  return { mediaId: record.id, objectKey, uploadUrl, expiresIn: r2.R2_UPLOAD_URL_EXPIRY, mode: 'r2' as const };
}

/** STEP 5: verify the object actually landed in storage, then mark COMPLETED. */
export async function completeVideoUpload(mediaId: string) {
  const record = await getVideoOrThrow(mediaId);
  if (!record.storageKey) throw new AppError('Video has no storage key', 400);

  if (record.storageProvider !== 'R2') {
    const exists = await fsp
      .access(localFilePath(record.storageKey))
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      await prisma.mediaFile.update({ where: { id: mediaId }, data: { uploadStatus: 'FAILED' } });
      throw new AppError('Uploaded file not found on the server — the upload may not have completed', 400);
    }
    const updated = await prisma.mediaFile.update({
      where: { id: mediaId },
      data: { uploadStatus: 'COMPLETED', uploadedAt: new Date(), url: localPublicUrl(record.storageKey) },
    });
    console.log(`[LOCAL] upload completed mediaId=${mediaId}`);
    return updated;
  }

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
export async function getVideoPlaybackUrl(
  mediaId: string,
  userId?: string,
  roles: string[] = []
) {
  const record = await getVideoOrThrow(mediaId);
  if (record.uploadStatus !== 'COMPLETED') throw new AppError('Video is not ready for playback', 409);
  if (!record.storageKey) throw new AppError('Video has no storage key', 400);

  let access: { url: string; expiresIn: number | null };
  let thumbnailUrl: string | null = null;
  const isLocal = record.storageProvider !== 'R2';

  if (record.visibility === 'PREMIUM') {
    // Premium playback needs an identified, entitled user. Anonymous callers
    // get 401 (not 403) so clients know to prompt for login.
    if (!userId) throw new AppError('Login required to watch this video', 401);
    const isAdmin = roles.includes('super_admin');
    if (!isAdmin && !(await checkSubscriptionActive(userId))) {
      throw new AppError('Premium subscription required to watch this video', 403);
    }
    if (isLocal) {
      access = { url: localPublicUrl(record.storageKey), expiresIn: null };
      if (record.thumbnailKey) thumbnailUrl = localPublicUrl(record.thumbnailKey);
    } else {
      access = { url: await r2.createDownloadUrl(record.storageKey), expiresIn: r2.R2_DOWNLOAD_URL_EXPIRY };
      if (record.thumbnailKey) thumbnailUrl = await r2.createDownloadUrl(record.thumbnailKey);
    }
  } else if (isLocal) {
    // PUBLIC videos are intentionally watchable without a session, matching how
    // free books/audio already behave.
    access = { url: localPublicUrl(record.storageKey), expiresIn: null };
    if (record.thumbnailKey) thumbnailUrl = localPublicUrl(record.thumbnailKey);
  } else {
    access = await resolveAccessUrl(record.storageKey);
    if (record.thumbnailKey) thumbnailUrl = (await resolveAccessUrl(record.thumbnailKey)).url;
  }

  console.log(`[R2] video accessed mediaId=${mediaId} visibility=${record.visibility} by=${userId ?? 'anonymous'}`);
  return { url: access.url, expiresIn: access.expiresIn, thumbnailUrl, durationSeconds: record.durationSeconds };
}

export async function getVideo(mediaId: string) {
  const record = await getVideoOrThrow(mediaId);
  let thumbnailUrl: string | null = null;
  if (record.thumbnailKey) {
    if (record.storageProvider !== 'R2') {
      thumbnailUrl = localPublicUrl(record.thumbnailKey);
    } else {
      try {
        thumbnailUrl = (await resolveAccessUrl(record.thumbnailKey)).url;
      } catch {
        thumbnailUrl = null;
      }
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

  const thumbnailKey = r2.generateThumbnailKey(
    record.storyId || record.bookId || 'unassigned',
    record.id,
    data.fileName
  );
  const uploadUrl = await r2.createUploadUrl(thumbnailKey, data.contentType);

  await prisma.mediaFile.update({ where: { id: mediaId }, data: { thumbnailKey } });

  console.log(`[R2] thumbnail upload initiated mediaId=${mediaId}`);
  return { mediaId, objectKey: thumbnailKey, uploadUrl, expiresIn: r2.R2_UPLOAD_URL_EXPIRY };
}

/** Delete the stored object(s) + soft-delete metadata (no orphaned files). */
export async function deleteVideo(mediaId: string) {
  const record = await getVideoOrThrow(mediaId);
  const isLocal = record.storageProvider !== 'R2';

  const removeOne = async (key: string | null) => {
    if (!key) return;
    if (isLocal) {
      await fsp.rm(localFilePath(key), { force: true }).catch(() => undefined);
      return;
    }
    try {
      await r2.deleteObject(key);
    } catch (e) {
      console.error('[R2] delete video object failed:', (e as Error).message);
    }
  };

  await removeOne(record.storageKey);
  await removeOne(record.thumbnailKey);

  await prisma.mediaFile.update({
    where: { id: mediaId },
    data: { deletedAt: new Date(), uploadStatus: 'DELETED' },
  });

  console.log(`[${isLocal ? 'LOCAL' : 'R2'}] video deleted mediaId=${mediaId}`);
}
