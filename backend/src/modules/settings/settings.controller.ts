import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as settingsService from './settings.service';
import { successResponse } from '../../utils/response';

export async function getAllSettings(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getAllSettings();
    successResponse(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateSetting(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const key = req.params.key as string;
    const { value } = req.body;
    const setting = await settingsService.updateSetting(key, value);
    successResponse(res, setting, 'Setting updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { settings } = req.body;
    const result = await settingsService.updateSettings(settings);
    successResponse(res, result, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
}
