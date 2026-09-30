import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as mediaService from './media.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function createFolder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const folder = await mediaService.createFolder(req.body, req.userId!);
    successResponse(res, folder, 'Folder created', 201);
  } catch (error) { next(error); }
}

export async function updateFolder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const folder = await mediaService.updateFolder((req.params.id as string), req.body);
    successResponse(res, folder, 'Folder updated');
  } catch (error) { next(error); }
}

export async function deleteFolder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await mediaService.deleteFolder((req.params.id as string));
    successResponse(res, null, 'Folder deleted');
  } catch (error) { next(error); }
}

export async function listFolders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { parentId } = req.query as any;
    const folders = await mediaService.listFolders(parentId);
    successResponse(res, folders, 'Folders retrieved');
  } catch (error) { next(error); }
}

export async function uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const file = await mediaService.uploadFile({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      type: req.file.mimetype.split('/')[0] as any,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      folderId: req.body.folderId || null,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    }, req.userId!);
    successResponse(res, file, 'File uploaded', 201);
  } catch (error) { next(error); }
}

export async function updateFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = await mediaService.updateFile((req.params.id as string), req.body);
    successResponse(res, file, 'File updated');
  } catch (error) { next(error); }
}

export async function deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await mediaService.deleteFile((req.params.id as string)); // soft delete
    successResponse(res, null, 'File moved to recycle bin');
  } catch (error) { next(error); }
}

export async function restoreFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = await mediaService.restoreFile((req.params.id as string));
    successResponse(res, file, 'File restored');
  } catch (error) { next(error); }
}

export async function previewFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = await mediaService.getFile((req.params.id as string));
    successResponse(res, file, 'File retrieved');
  } catch (error) { next(error); }
}

export async function listFiles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, type, folderId, deleted } = req.query as any;
    const result = await mediaService.listFiles({ page: Number(page), limit: Number(limit), type, folderId, deleted: deleted === 'true' });
    paginatedResponse(res, result.files, result.total, Number(page), Number(limit), 'Files retrieved');
  } catch (error) { next(error); }
}

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await mediaService.getStats();
    successResponse(res, stats, 'Media stats retrieved');
  } catch (error) { next(error); }
}
