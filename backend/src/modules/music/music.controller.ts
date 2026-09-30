import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { AppError } from '../../middleware/errorHandler';
import * as musicService from './music.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function createTrack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.createTrack(req.body);
    successResponse(res, data, 'Track created', 201);
  } catch (error) { next(error); }
}

export async function updateTrack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.updateTrack(req.params.id as string, req.body);
    successResponse(res, data, 'Track updated');
  } catch (error) { next(error); }
}

export async function deleteTrack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await musicService.deleteTrack(req.params.id as string);
    successResponse(res, null, 'Track deleted');
  } catch (error) { next(error); }
}

export async function getTrackById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.getTrackById(req.params.id as string, req.userId);
    successResponse(res, data, 'Track retrieved');
  } catch (error) { next(error); }
}

export async function listTracks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tracks, total } = await musicService.listTracks(req.query as any, req.userId);
    paginatedResponse(res, tracks, total, (req.query as any).page, (req.query as any).limit, 'Tracks retrieved');
  } catch (error) { next(error); }
}

export async function getFeaturedTracks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.getFeaturedTracks(10, req.userId);
    successResponse(res, data, 'Featured tracks retrieved');
  } catch (error) { next(error); }
}

export async function uploadAudio(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No audio file uploaded', 400);
    const audioUrl = await musicService.uploadAudioFile(req.file);
    successResponse(res, { audioUrl }, 'Audio uploaded', 201);
  } catch (error) { next(error); }
}

export async function uploadCover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No cover file uploaded', 400);
    const coverUrl = await musicService.uploadCoverFile(req.file);
    successResponse(res, { coverUrl }, 'Cover uploaded', 201);
  } catch (error) { next(error); }
}

export async function uploadPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No PDF file uploaded', 400);
    const pdfUrl = await musicService.uploadPdfFile(req.file);
    successResponse(res, { pdfUrl }, 'PDF uploaded', 201);
  } catch (error) { next(error); }
}

export async function getGenres(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.getGenres();
    successResponse(res, data, 'Genres retrieved');
  } catch (error) { next(error); }
}

export async function incrementPlay(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.incrementPlayCount(req.params.id as string);
    successResponse(res, data, 'Play counted');
  } catch (error) { next(error); }
}

export async function getPlayUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await musicService.getPlayableUrl(req.params.id as string, req.userId);
    successResponse(res, data, 'Play URL resolved');
  } catch (error) { next(error); }
}
