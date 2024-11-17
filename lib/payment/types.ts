export type PaymentType = 'order' | 'wallet_topup' | 'reseller_registration';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type BkashStatus = 'success' | 'failure' | 'cancel';

export interface PaymentMetadata {
  type: PaymentType;
  userId?: string;
  amount?: number;
  cartData?: any;
  registrationData?: {
    email: string;
    password: string;
    name: string;
    businessName: string;
  };
  description?: string;
}