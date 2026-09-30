import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as subscriptionService from './subscription.service';
import { successResponse } from '../../utils/response';

export async function getPlans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plans = await subscriptionService.getPlans();
    successResponse(res, plans, 'Plans retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getPlanById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plan = await subscriptionService.getPlanById(req.params.id as string as string);
    successResponse(res, plan, 'Plan retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getPlansAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plans = await subscriptionService.getPlansAll();
    successResponse(res, plans, 'All plans retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plan = await subscriptionService.createPlan(req.body);
    successResponse(res, plan, 'Plan created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plan = await subscriptionService.updatePlan(req.params.id as string as string, req.body);
    successResponse(res, plan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deletePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await subscriptionService.deletePlan(req.params.id as string as string);
    successResponse(res, null, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function subscribe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { planId, couponCode, gateway } = req.body;
    const result = await subscriptionService.subscribe(req.userId!, planId, couponCode, gateway);
    successResponse(res, result, 'Subscription initiated successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getUserSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.userId!);
    successResponse(res, subscription, 'Current subscription retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/** GET /subscriptions/me — computed subscription status for the mobile paywall/cache. */
export async function getMySubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.userId!);
    const isActive = !!subscription;
    let daysRemaining: number | null = null;
    if (subscription) {
      daysRemaining = Math.max(
        0,
        Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );
    }
    successResponse(
      res,
      {
        hasSubscription: isActive,
        isActive,
        activePlanId: subscription?.planId ?? null,
        daysRemaining,
        subscription,
      },
      'Subscription status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
}

export async function cancelSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await subscriptionService.cancelSubscription(req.userId!);
    successResponse(res, result, 'Subscription cancelled successfully');
  } catch (error) {
    next(error);
  }
}

export async function getSubscriptionHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const history = await subscriptionService.getSubscriptionHistory(req.userId!);
    successResponse(res, history, 'Subscription history retrieved successfully');
  } catch (error) {
    next(error);
  }
}

