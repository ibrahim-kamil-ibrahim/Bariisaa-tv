import { Router } from 'express';
import * as oauthController from './oauth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authorizeSchema, tokenSchema, revokeSchema } from './oauth.validation';
import { authLimiter } from '../../middleware/rateLimiter';

const router: Router = Router();

router.get(
  '/authorize',
  authLimiter,
  authenticate,
  oauthController.authorize
);

router.post(
  '/token',
  authLimiter,
  validate(tokenSchema),
  oauthController.token
);

router.post(
  '/revoke',
  authLimiter,
  oauthController.revoke
);

router.get(
  '/userinfo',
  authenticate,
  oauthController.userinfo
);

router.get(
  '/.well-known/openid-configuration',
  oauthController.discovery
);

export default router;
