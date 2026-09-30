import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as doctorService from './my-doctor.service';
import { successResponse } from '../../utils/response';

export async function createHealthTip(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await doctorService.createHealthTip(req.body);
    successResponse(res, data, 'Health tip created', 201);
  } catch (error) { next(error); }
}

export async function updateHealthTip(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await doctorService.updateHealthTip(req.params.id as string, req.body);
    successResponse(res, data, 'Health tip updated');
  } catch (error) { next(error); }
}

export async function deleteHealthTip(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await doctorService.deleteHealthTip(req.params.id as string);
    successResponse(res, null, 'Health tip deleted');
  } catch (error) { next(error); }
}

export async function createDoctorProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await doctorService.createDoctorProfile(req.body);
    successResponse(res, data, 'Doctor profile created', 201);
  } catch (error) { next(error); }
}

export async function updateDoctorProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await doctorService.updateDoctorProfile(req.params.id as string, req.body);
    successResponse(res, data, 'Doctor profile updated');
  } catch (error) { next(error); }
}

export async function deleteDoctorProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await doctorService.deleteDoctorProfile(req.params.id as string);
    successResponse(res, null, 'Doctor profile deleted');
  } catch (error) { next(error); }
}

export async function listHealthTips(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await doctorService.listHealthTips();
    successResponse(res, data, 'Health tips retrieved');
  } catch (error) { next(error); }
}

export async function listDoctorProfiles(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await doctorService.listDoctorProfiles();
    successResponse(res, data, 'Doctor profiles retrieved');
  } catch (error) { next(error); }
}
