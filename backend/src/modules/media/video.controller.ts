import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as videoService from './video.service';
import { successResponse } from '../../utils/response';

export async function requestVideoUploadUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await videoService.requestVideoUploadUrl(req.body, req.userId!);
    successResponse(res, result, 'Upload URL generated', 201);
  } catch (error) {
    next(error);
  }
}

export async function completeVideoUpload(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const video = await videoService.completeVideoUpload(req.params.id as string);
    successResponse(res, video, 'Upload completed');
  } catch (error) {
    next(error);
  }
}

export async function getVideoPlaybackUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await videoService.getVideoPlaybackUrl(
      req.params.id as string,
      req.userId,
      req.userRoles || []
    );
    successResponse(res, result, 'Playback URL generated');
  } catch (error) {
    next(error);
  }
}

export async function getVideo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const video = await videoService.getVideo(req.params.id as string);
    successResponse(res, video, 'Video retrieved');
  } catch (error) {
    next(error);
  }
}

export async function requestThumbnailUploadUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await videoService.requestThumbnailUploadUrl(req.params.id as string, req.body);
    successResponse(res, result, 'Thumbnail upload URL generated', 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteVideo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await videoService.deleteVideo(req.params.id as string);
    successResponse(res, null, 'Video deleted');
  } catch (error) {
    next(error);
  }
}
