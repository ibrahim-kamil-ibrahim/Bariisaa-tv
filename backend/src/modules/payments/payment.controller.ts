import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as paymentService from './payment.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function validateCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, planId } = req.body;
    const result = await paymentService.validateCoupon(code, planId, req.userId!);
    successResponse(res, result, 'Coupon validated successfully');
  } catch (error) {
    next(error);
  }
}

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const result = await paymentService.handleStripeWebhook(req.body, signature);
    successResponse(res, result, 'Webhook processed');
  } catch (error) {
    next(error);
  }
}

export async function handleChapaWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-chapa-signature'] as string | undefined;
    const result = await paymentService.handleChapaWebhook(req.body, signature);
    successResponse(res, result, 'Webhook processed');
  } catch (error) {
    next(error);
  }
}

export async function handleTelebirrCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-telebirr-signature'] as string | undefined;
    const result = await paymentService.handleTelebirrCallback(req.body, signature);
    successResponse(res, result, 'Callback processed');
  } catch (error) {
    next(error);
  }
}

export async function getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getPaymentHistory(req.userId!, page, limit);
    paginatedResponse(res, result.payments, result.total, result.page, result.limit, 'Payment history retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getPaymentById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.getPaymentById(req.params.id as string as string, req.userId!);
    successResponse(res, payment, 'Payment retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAllPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const gateway = req.query.gateway as string | undefined;
    const result = await paymentService.getAllPayments(page, limit, status, gateway);
    paginatedResponse(res, result.payments, result.total, result.page, result.limit, 'Payments retrieved');
  } catch (error) {
    next(error);
  }
}

export async function refundPaymentHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { paymentId } = req.body;
    const result = await paymentService.refundPayment(paymentId);
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

