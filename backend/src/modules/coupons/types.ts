export interface CouponResponse {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountPercent: number;
  discountAmount: number;
  maxUses: number | null;
  currentUses: number;
  perUserLimit: number;
  applicablePlans: unknown;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}
