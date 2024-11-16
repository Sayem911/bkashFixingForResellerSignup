import { NextRequest } from 'next/server';
import { Payment } from '@/lib/models/payment.model';
import { executeBkashPayment } from '@/lib/bkash';
import { handleProductPayment } from '@/lib/payment/handlers/product';
import { handleWalletTopup } from '@/lib/payment/handlers/wallet';
import { handleResellerRegistration } from '@/lib/payment/handlers/reseller-registration';
import dbConnect from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    if (!paymentID || !status) {
      return Response.redirect(new URL('/orders/error', req.url));
    }

    // Find payment record
    const payment = await Payment.findOne({ paymentId: paymentID });
    if (!payment) {
      console.error('Payment not found:', paymentID);
      return Response.redirect(new URL('/orders/error', req.url));
    }

    // If payment is already completed, redirect to success
    if (payment.status === 'completed') {
      const redirectUrl = getRedirectUrl(payment);
      return Response.redirect(new URL(redirectUrl, req.url));
    }

    if (status === 'success') {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Execute bKash payment
        const paymentResult = await executeBkashPayment(paymentID);
        
        if (paymentResult.statusCode === '0000' && 
            paymentResult.transactionStatus === 'Completed') {

          let redirectUrl = '/orders/error';

          // Handle payment based on type
          switch (payment.metadata.type) {
            case 'order': {
              const orderId = await handleProductPayment(payment, paymentResult.trxID, session);
              redirectUrl = `/orders/${orderId}/success`;
              break;
            }
            case 'wallet_topup': {
              await handleWalletTopup(payment, paymentResult.trxID, session);
              redirectUrl = `/reseller/wallet/${payment._id}/success`;
              break;
            }
            case 'reseller_registration': {
              await handleResellerRegistration(payment, paymentResult.trxID, session);
              redirectUrl = '/auth/reseller/register/success';
              break;
            }
          }

          await session.commitTransaction();
          return Response.redirect(new URL(redirectUrl, req.url));
        }

        await session.abortTransaction();
        return Response.redirect(new URL('/orders/error', req.url));
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
        
        return Response.redirect(new URL('/orders/error', req.url));
      } finally {
        session.endSession();
      }
    }

    if (status === 'cancel' || status === 'failure') {
      // Update payment status
      payment.status = status === 'cancel' ? 'cancelled' : 'failed';
      payment.metadata = {
        ...payment.metadata,
        cancelledAt: new Date(),
        cancelReason: status === 'cancel' ? 'User cancelled the transaction' : 'Payment failed'
      };
      await payment.save();

      // Redirect based on payment type and status
      const redirectUrl = getFailureRedirectUrl(payment.metadata.type, status);
      return Response.redirect(new URL(redirectUrl, req.url));
    }

    // Default error redirect
    return Response.redirect(new URL('/orders/error', req.url));
  } catch (error) {
    console.error('bKash callback error:', error);
    return Response.redirect(new URL('/orders/error', req.url));
  }
}

function getRedirectUrl(payment: any) {
  switch (payment.metadata.type) {
    case 'order':
      return payment.orderId ? `/orders/${payment.orderId}/success` : '/orders/error';
    case 'wallet_topup':
      return `/reseller/wallet/${payment._id}/success`;
    case 'reseller_registration':
      return '/auth/reseller/register/success';
    default:
      return '/orders/error';
  }
}

function getFailureRedirectUrl(type: string, status: string) {
  const isCancelled = status === 'cancel';
  
  switch (type) {
    case 'order':
      return isCancelled ? '/orders/cancelled' : '/orders/failed';
    case 'wallet_topup':
      return `/reseller/wallet?status=${isCancelled ? 'cancelled' : 'failed'}`;
    case 'reseller_registration':
      return `/auth/reseller/register/${isCancelled ? 'cancelled' : 'failed'}`;
    default:
      return '/orders/error';
  }
}