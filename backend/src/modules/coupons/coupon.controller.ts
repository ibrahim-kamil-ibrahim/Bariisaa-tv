import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as couponService from './coupon.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function listCoupons(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const { coupons, total } = await couponService.listCoupons(page, limit, search);
    paginatedResponse(res, coupons, total, page, limit, 'Coupons retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getCouponById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.getCouponById(req.params.id as string as string);
    successResponse(res, coupon, 'Coupon retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.createCoupon(req.body);
    successResponse(res, coupon, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.updateCoupon(req.params.id as string as string, req.body);
    successResponse(res, coupon, 'Coupon updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await couponService.deleteCoupon(req.params.id as string as string);
    successResponse(res, result, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
}
