import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as deviceService from './device.service';
import { successResponse } from '../../utils/response';

export async function registerDevice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await deviceService.registerDevice(req.userId!, req.body);
    successResponse(res, result, 'Device registered', 201);
  } catch (error) {
    next(error);
  }
}

export async function listDevices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const devices = await deviceService.listDevices(req.userId!);
    successResponse(res, devices);
  } catch (error) {
    next(error);
  }
}

export async function removeDevice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await deviceService.removeDevice(req.userId!, req.params.id as string);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function updateFcmToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { fcmToken } = req.body;
    const result = await deviceService.updateFcmToken(
      req.userId!,
      req.params.deviceUid as string,
      fcmToken
    );
    successResponse(res, result, 'FCM token updated');
  } catch (error) {
    next(error);
  }
}

