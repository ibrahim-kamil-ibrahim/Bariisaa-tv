import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as noteService from './note.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const note = await noteService.createNote(req.userId!, req.body);
    successResponse(res, note, 'Note created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const note = await noteService.updateNote(req.params.id as string, req.userId!, req.body);
    successResponse(res, note, 'Note updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await noteService.deleteNote(req.params.id as string, req.userId!);
    successResponse(res, result, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getNotes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notes = await noteService.getNotes(req.userId!, req.params.bookId as string);
    successResponse(res, notes, 'Notes retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAllNotes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await noteService.getAllNotes(req.userId!, page, limit);
    paginatedResponse(res, result.notes, result.total, result.page, result.limit, 'Notes retrieved successfully');
  } catch (error) {
    next(error);
  }
}

