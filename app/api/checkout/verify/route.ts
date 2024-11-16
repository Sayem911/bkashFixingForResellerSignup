import { NextRequest } from 'next/server';
import { Payment } from '@/lib/models/payment.model';
import dbConnect from '@/lib/db/mongodb';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Clone the request before reading it
    const clonedReq = req.clone();
    const { paymentId } = await clonedReq.json();

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
      case 'completed':
        return Response.json({
          status: 'completed',
          redirectUrl: getRedirectUrl(payment)
        });

      case 'failed':
      case 'cancelled':
        return Response.json({
          status: payment.status,
          redirectUrl: `/orders/error`
        });

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

function getRedirectUrl(payment: any) {
  switch (payment.metadata.type) {
    case 'order':
      return payment.orderId ? `/orders/${payment.orderId}/success` : '/orders/error';
    case 'wallet_topup':
      return '/reseller/wallet?status=success';
    case 'reseller_registration':
      return '/auth/reseller/register/success';
    default:
      return '/orders/error';
  }
}