import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as categoryService from './category.service';
import { successResponse } from '../../utils/response';
import { uploadFile } from '../../utils/signedUrl';

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data: Record<string, unknown> = { ...req.body };
    if (req.file) {
      data.imageUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'categories');
    }
    if (data.sortOrder) data.sortOrder = Number(data.sortOrder);
    const category = await categoryService.createCategory(data as any);
    successResponse(res, category, 'Category created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data: Record<string, unknown> = { ...req.body };
    if (req.file) {
      data.imageUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'categories');
    }
    if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);
    const category = await categoryService.updateCategory(req.params.id as string, data as any);
    successResponse(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.deleteCategory(req.params.id as string);
    successResponse(res, data, 'Category deleted');
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.getCategoryById(req.params.id as string);
    successResponse(res, data, 'Category retrieved');
  } catch (error) {
    next(error);
  }
}

export async function listCategories(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.listCategories();
    successResponse(res, data, 'Categories retrieved');
  } catch (error) {
    next(error);
  }
}

export async function listExploreCategories(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.listExploreCategories();
    successResponse(res, data, 'Explore categories retrieved');
  } catch (error) {
    next(error);
  }
}

