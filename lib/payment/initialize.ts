import { createBkashPayment } from '@/lib/bkash';
import { Payment } from '@/lib/models/payment.model';
import { PaymentMetadata } from './types';

export async function initializePayment(metadata: PaymentMetadata) {
  try {
    let amount;
    let orderId;
    
    switch (metadata.type) {
      case 'order':
        if (!metadata.cartData?.total) {
          throw new Error('Cart data is required for order payments');
        }
        amount = metadata.cartData.total;
        orderId = `order-${Date.now()}`;
        break;
        
      case 'wallet_topup':
        if (!metadata.amount) {
          throw new Error('Amount is required for wallet top-up');
        }
        amount = metadata.amount;
        orderId = `topup-${Date.now()}`;
        break;
        
      case 'reseller_registration':
        if (!metadata.registrationData) {
          throw new Error('Registration data is required');
        }
        amount = metadata.amount;
        orderId = `reg-${Date.now()}`;
        break;
        
      default:
        throw new Error('Invalid payment type');
    }

    // Create bKash payment
    const bkashPayment = await createBkashPayment(amount, orderId);

    // Create payment record
    const payment = await Payment.create({
      amount,
      currency: 'BDT',
      provider: 'bkash',
      paymentId: bkashPayment.paymentID,
      status: 'pending',
      metadata: {
        ...metadata,
        bkashURL: bkashPayment.bkashURL,
        orderId
      }
    });

    return {
      paymentId: payment.paymentId,
      bkashURL: bkashPayment.bkashURL
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
}