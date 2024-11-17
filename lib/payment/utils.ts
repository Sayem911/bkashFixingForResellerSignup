import { PaymentType } from './types';
import { Order } from '@/lib/models/order.model';

export function getRedirectUrl(type: PaymentType, status: string, paymentId?: string) {
  switch (type) {
    case 'order':
      switch (status) {
        case 'success':
          return `/orders/${paymentId}/success`;
        case 'cancelled':
          return '/orders/cancelled';
        case 'failed':
          return '/orders/failed';
        default:
          return '/orders/error';
      }

    case 'wallet_topup':
      switch (status) {
        case 'success':
          return '/reseller/wallet?status=success';
        case 'cancelled':
          return '/reseller/wallet?status=cancelled';
        case 'failed':
          return '/reseller/wallet?status=failed';
        default:
          return '/reseller/wallet?status=error';
      }

    case 'reseller_registration':
      switch (status) {
        case 'success':
          return '/auth/reseller/register/success';
        case 'cancelled':
          return '/auth/reseller/register/cancelled';
        case 'failed':
          return '/auth/reseller/register/failed';
        default:
          return '/auth/reseller/register/error';
      }

    default:
      return '/error';
  }
}

export async function generateOrderNumber() {
  const count = await Order.countDocuments();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = (count + 1).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${sequence}`;
}