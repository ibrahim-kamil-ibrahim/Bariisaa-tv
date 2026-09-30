import { env } from './environment';

export const stripeConfig = {
  secretKey: env.STRIPE_SECRET_KEY || '',
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
};

export const telebirrConfig = {
  appKey: env.TELEBIRR_APP_KEY || '',
  appSecret: env.TELEBIRR_APP_SECRET || '',
  merchantId: env.TELEBIRR_MERCHANT_ID || '',
  baseUrl: env.TELEBIRR_BASE_URL || '',
};

export const chapaConfig = {
  secretKey: env.CHAPA_SECRET_KEY || '',
  webhookSecret: env.CHAPA_WEBHOOK_SECRET || '',
  baseUrl: env.CHAPA_BASE_URL,
};
