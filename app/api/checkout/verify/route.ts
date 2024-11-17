import { NextRequest } from 'next/server';
import { Payment } from '@/lib/models/payment.model';
import dbConnect from '@/lib/db/mongodb';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { paymentId } = await req.json();

    if (!paymentId) {
      return Response.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await Payment.findOne({ paymentId }).lean();
    if (!payment) {
      return Response.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Return appropriate response based on payment status
    switch (payment.status) {
      case 'completed': {
        const redirectUrl = getRedirectUrl(payment.metadata.type, 'success', payment.orderId?.toString());
        return Response.json({
          status: 'completed',
          redirectUrl
        });
      }

      case 'failed': {
        const redirectUrl = getRedirectUrl(payment.metadata.type, 'failed');
        return Response.json({
          status: 'failed',
          redirectUrl
        });
      }

      case 'cancelled': {
        const redirectUrl = getRedirectUrl(payment.metadata.type, 'cancelled');
        return Response.json({
          status: 'cancelled',
          redirectUrl
        });
      }

      case 'pending':
      default:
        return Response.json({
          status: 'pending',
          bkashURL: payment.metadata?.bkashURL
        });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

function getRedirectUrl(type: string, status: string, orderId?: string) {
  switch (type) {
    case 'order': {
      switch (status) {
        case 'success':
          return orderId ? `/orders/${orderId}/success` : '/orders/error';
        case 'failed':
          return '/orders/failed';
        case 'cancelled':
          return '/orders/cancelled';
        default:
          return '/orders/error';
      }
    }

    case 'wallet_topup': {
      switch (status) {
        case 'success':
          return '/reseller/wallet?status=success';
        case 'failed':
          return '/reseller/wallet?status=failed';
        case 'cancelled':
          return '/reseller/wallet?status=cancelled';
        default:
          return '/reseller/wallet/error';
      }
    }

    case 'reseller_registration': {
      switch (status) {
        case 'success':
          return '/auth/reseller/register/success';
        case 'failed':
          return '/auth/reseller/register/failed';
        case 'cancelled':
          return '/auth/reseller/register/cancelled';
        default:
          return '/auth/reseller/register/error';
      }
    }

    default:
      return '/orders/error';
  }
}