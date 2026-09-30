import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { uploadFile, generateSignedGetUrl } from '../../utils/signedUrl';
import { env } from '../../config/environment';
import {
  getActivePlanId,
  hasContentAccess,
  resolveActivePlanFor,
} from '../../middleware/subscriptionGuard';

interface CreateTrackData {
  title: string;
  artist?: string;
  artistId?: string;
  album?: string;
  coverUrl?: string;
  audioUrl: string;
  pdfUrl?: string;
  genre?: string;
  price?: number;
  durationSeconds?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured?: boolean;
  trackOrder?: number;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
}

interface TrackQuery {
  page?: number;
  limit?: number;
  genre?: string;
  status?: string;
  search?: string;
  accessTier?: 'FREE' | 'PAID';
}

const artistInclude = {
  artistAuthor: { select: { id: true, name: true, photoUrl: true } },
};

/**
 * Annotate tracks with `isLocked`. Locked (PAID, not entitled) tracks also get
 * their media URLs stripped so clients can never bypass the paywall by playing
 * the raw URL. `isLocked` is advisory — playback is re-validated in getPlayableUrl.
 */
async function withMusicLocks<T extends { id: string; accessTier?: string | null; isPremium?: boolean | null; requiredPlanId?: string | null }>(
  tracks: T[],
  userId?: string | null
) {
  const activePlanId = await resolveActivePlanFor(userId, tracks);
  return tracks.map((track) => {
    const entitled = hasContentAccess(track, activePlanId);
    if (entitled) return { ...track, isLocked: false };
    return { ...track, isLocked: true, audioUrl: null as any, pdfUrl: null };
  });
}

/** Resolve an artistId → Author, denormalizing the display name for mobile. */
async function resolveArtist(payload: Record<string, any>, artistId?: string) {
  if (!artistId) return;
  const author = await prisma.author.findUnique({ where: { id: artistId } });
  if (!author) throw new AppError('Artist not found', 404);
  payload.artistId = artistId;
  payload.artist = author.name;
}

export async function createTrack(data: CreateTrackData) {
  const payload: Record<string, any> = { ...data };
  delete payload.artistId;
  await resolveArtist(payload, data.artistId);
  return prisma.musicTrack.create({ data: payload as any, include: artistInclude });
}

export async function updateTrack(id: string, data: Partial<CreateTrackData>) {
  const existing = await prisma.musicTrack.findUnique({ where: { id } });
  if (!existing) throw new AppError('Track not found', 404);
  const payload: Record<string, any> = { ...data };
  delete payload.artistId;
  if (data.artistId) await resolveArtist(payload, data.artistId);
  return prisma.musicTrack.update({ where: { id }, data: payload as any, include: artistInclude });
}

export async function deleteTrack(id: string) {
  const existing = await prisma.musicTrack.findUnique({ where: { id } });
  if (!existing) throw new AppError('Track not found', 404);
  return prisma.musicTrack.update({ where: { id }, data: { status: 'ARCHIVED' as any } });
}

export async function getTrackById(id: string, userId?: string | null) {
  const track = await prisma.musicTrack.findUnique({ where: { id }, include: artistInclude });
  if (!track) throw new AppError('Track not found', 404);
  const [annotated] = await withMusicLocks([track], userId);
  return annotated;
}

export async function listTracks(query: TrackQuery, userId?: string | null) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = { NOT: { status: 'ARCHIVED' } };
  if (query.genre) where.genre = query.genre;
  if (query.status) where.status = query.status;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
  if (query.accessTier) where.accessTier = query.accessTier;

  const [tracks, total] = await Promise.all([
    prisma.musicTrack.findMany({
      where,
      skip,
      take: limit,
      orderBy: { trackOrder: 'asc' },
      include: artistInclude,
    }),
    prisma.musicTrack.count({ where }),
  ]);
  return { tracks: await withMusicLocks(tracks, userId), total };
}

export async function getFeaturedTracks(limit = 10, userId?: string | null) {
  const tracks = await prisma.musicTrack.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    take: limit,
    orderBy: { playCount: 'desc' },
    include: artistInclude,
  });
  return withMusicLocks(tracks, userId);
}

export async function uploadAudioFile(file: Express.Multer.File) {
  return uploadFile(file.buffer, file.originalname, file.mimetype, 'music');
}

export async function uploadCoverFile(file: Express.Multer.File) {
  return uploadFile(file.buffer, file.originalname, file.mimetype, 'music-covers');
}

export async function uploadPdfFile(file: Express.Multer.File) {
  return uploadFile(file.buffer, file.originalname, file.mimetype, 'music-pdfs');
}

/** Distinct genres present on non-archived tracks, as `{ name }` objects. */
export async function getGenres() {
  const rows = await prisma.musicTrack.findMany({
    where: { NOT: { status: 'ARCHIVED' } },
    select: { genre: true },
    distinct: ['genre'],
  });
  return rows
    .map((r) => ({ name: r.genre }))
    .filter((g) => g.name && g.name.trim() !== '');
}

/** Increment a track's playCount exactly once per explicit play event. */
export async function incrementPlayCount(id: string) {
  const track = await prisma.musicTrack.findUnique({ where: { id } });
  if (!track) throw new AppError('Track not found', 404);
  await prisma.musicTrack.update({
    where: { id },
    data: { playCount: { increment: 1 } },
  });
  return { playCount: track.playCount + 1 };
}

/**
 * Resolve a playable URL for a track.
 *
 * audioUrl may be either:
 *  - a bare object key (S3/R2) → return a short-lived signed URL
 *  - a full http(s) URL        → return as-is
 *  - a local upload path       → rewrite host to this server's APP_URL
 *
 * This keeps playback working across local-disk and R2 deployments without
 * the mobile client needing to know which storage backend is in use.
 */
export async function getPlayableUrl(id: string, userId?: string | null) {
  const track = await prisma.musicTrack.findUnique({ where: { id } });
  if (!track) throw new AppError('Track not found', 404);

  // Server-side entitlement re-check — never trust the client's isLocked flag.
  if (!hasContentAccess(track, await getActivePlanId(userId))) {
    throw new AppError('Subscription required to play this track', 403);
  }

  const audioUrl = track.audioUrl;
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return { url: audioUrl };
  }

  // Bare object key → signed URL via S3-compatible storage when available.
  try {
    const url = await generateSignedGetUrl(audioUrl);
    return { url };
  } catch {
    // S3 not configured → assume it is a local upload path (uploads/...).
    const relative = audioUrl.replace(/^\//, '').replace(/^uploads\//, 'uploads/');
    return { url: `${env.APP_URL.replace(/\/$/, '')}/${relative}` };
  }
}
