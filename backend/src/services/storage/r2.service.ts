import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/environment';
import { AppError } from '../../middleware/errorHandler';
import path from 'path';

/**
 * Cloudflare R2 storage service.
 *
 * R2 exposes an S3-compatible API. This service is the single gateway to R2:
 *   - scoped, expiring presigned PUT URLs (direct client upload)
 *   - short-lived presigned GET URLs (secure playback)
 *   - object deletion + existence checks
 *   - structured object keys
 *
 * Large videos are uploaded by clients DIRECTLY to R2 and are never proxied
 * through the Express backend, so the VPS never becomes a bandwidth bottleneck.
 *
 * Security:
 *   - R2 credentials live only on the server (never returned to clients).
 *   - Presigned URLs are scoped to one object key, carry a ContentType, and expire.
 *   - Signed URLs are never logged.
 */

const R2_ENDPOINT =
  env.R2_ENDPOINT ||
  (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export const R2_UPLOAD_URL_EXPIRY = 900; // 15 minutes (upload)
export const R2_DOWNLOAD_URL_EXPIRY = 300; // 5 minutes (playback)

function isConfigured(): boolean {
  return Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME && R2_ENDPOINT);
}

let _client: S3Client | null = null;

function r2Client(): S3Client {
  if (!isConfigured()) {
    throw new AppError('Cloudflare R2 is not configured', 503);
  }
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

function bucket(): string {
  return env.R2_BUCKET_NAME!;
}

// ── object keys ────────────────────────────────────────────────────────────

function sanitizeSegment(segment: string): string {
  // Prevent path traversal / arbitrary key injection.
  return segment.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function extensionFromFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext && ext.length > 1 && ext.length <= 10) return ext.slice(1);
  return '';
}

function extensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'application/pdf': 'pdf',
  };
  return map[contentType] || 'bin';
}

/** videos/{bookId}/{videoId}/original/video.{ext} */
export function generateVideoKey(
  bookId: string,
  videoId: string,
  fileName: string,
  contentType: string
): string {
  const ext = extensionFromFileName(fileName) || extensionFromContentType(contentType);
  return `videos/${sanitizeSegment(bookId)}/${videoId}/original/video.${ext}`;
}

/** thumbnails/{bookId}/{videoId}/thumbnail.{ext} */
export function generateThumbnailKey(bookId: string, videoId: string, fileName: string): string {
  const ext = extensionFromFileName(fileName) || extensionFromContentType('image/jpeg');
  return `thumbnails/${sanitizeSegment(bookId)}/${videoId}/thumbnail.${ext}`;
}

/** audio/{bookId}/{audioId}/audio.{ext} */
export function generateAudioKey(bookId: string, audioId: string, fileName: string): string {
  const ext = extensionFromFileName(fileName) || extensionFromContentType('audio/mpeg');
  return `audio/${sanitizeSegment(bookId)}/${audioId}/audio.${ext}`;
}

/** documents/{bookId}/{ebookId}/book.{ext} */
export function generateDocumentKey(bookId: string, ebookId: string, fileName: string): string {
  const ext = extensionFromFileName(fileName) || extensionFromContentType('application/pdf');
  return `documents/${sanitizeSegment(bookId)}/${ebookId}/book.${ext}`;
}

// ── operations ─────────────────────────────────────────────────────────────

/** Presigned PUT URL for direct client → R2 upload. */
export async function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = R2_UPLOAD_URL_EXPIRY
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), command, { expiresIn });
}

/** Short-lived presigned GET URL for secure playback/download. */
export async function createDownloadUrl(
  key: string,
  expiresIn = R2_DOWNLOAD_URL_EXPIRY
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(r2Client(), command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

/** Returns true when the object exists; false on 404/NotFound. */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2Client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
    if (e.$metadata?.httpStatusCode === 404 || e.name === 'NotFound' || e.name === 'NoSuchKey') {
      return false;
    }
    // Do not leak the raw error (it may embed request context) — log a sanitised line.
    console.error('[R2] objectExists failed:', e.message || e.name || 'unknown');
    throw new AppError('Cloudflare R2 unavailable', 503);
  }
}

/** Public URL for PUBLIC content. Requires R2_PUBLIC_URL. */
export function getPublicUrl(key: string): string {
  if (!env.R2_PUBLIC_URL) {
    throw new AppError('R2_PUBLIC_URL is not configured', 503);
  }
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}
