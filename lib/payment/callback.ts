import { executeBkashPayment } from '@/lib/bkash';
import { Payment } from '@/lib/models/payment.model';
import { handleProductPayment } from './handlers/product';
import { handleWalletTopup } from './handlers/wallet';
import { handleResellerRegistration } from './handlers/reseller-registration';
import { getRedirectUrl } from './utils';
import { BkashStatus } from './types';
import mongoose from 'mongoose';

export async function handlePaymentCallback(paymentId: string, status: BkashStatus) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new Error('Payment not found');
    }

    // If payment is already completed, return success
    if (payment.status === 'completed') {
      const redirectUrl = getRedirectUrl(payment.metadata.type, 'success', payment.orderId?.toString());
      return { success: true, redirectUrl };
    }

    if (status === 'success') {
      try {
        // Execute bKash payment
        const paymentResult = await executeBkashPayment(paymentId);
        
        if (paymentResult.statusCode === '0000' && 
            paymentResult.transactionStatus === 'Completed') {
          
          let resultId;

          // Handle payment based on type
          switch (payment.metadata.type) {
            case 'order': {
              resultId = await handleProductPayment(payment, paymentResult.trxID, session);
              break;
            }
            case 'wallet_topup': {
              await handleWalletTopup(payment, paymentResult.trxID, session);
              break;
            }
            case 'reseller_registration': {
              resultId = await handleResellerRegistration(payment, paymentResult.trxID, session);
              break;
            }
          }

          await session.commitTransaction();
          
          const redirectUrl = getRedirectUrl(payment.metadata.type, 'success', resultId?.toString());
          return { success: true, redirectUrl };
        }
      } catch (error) {
        await session.abortTransaction();
        console.error('Payment execution error:', error);
        
        payment.status = 'failed';
        payment.metadata = {
          ...payment.metadata,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Payment execution failed'
        };
        await payment.save();
      }
    }

    if (status === 'cancel' || status === 'failure') {
      payment.status = status === 'cancel' ? 'cancelled' : 'failed';
      payment.metadata = {
        ...payment.metadata,
        cancelledAt: new Date(),
        cancelReason: status === 'cancel' ? 'User cancelled the transaction' : 'Payment failed'
      };
      await payment.save();

      const redirectUrl = getRedirectUrl(payment.metadata.type, status === 'cancel' ? 'cancelled' : 'failed');
      return { success: false, redirectUrl };
    }

    const redirectUrl = getRedirectUrl(payment.metadata.type, 'error');
    return { success: false, redirectUrl };
  } catch (error) {
    await session.abortTransaction();
    console.error('Payment callback error:', error);
    throw error;
  } finally {
    session.endSession();
  }
}