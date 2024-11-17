import { NextRequest } from 'next/server';
import { handlePaymentCallback } from '@/lib/payment';
import dbConnect from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    if (!paymentID || !status) {
      return Response.redirect(new URL('/reseller/wallet/error', req.url));
    }

    const result = await handlePaymentCallback(paymentID, status);
    return Response.redirect(new URL(result.redirectUrl, req.url));
  } catch (error) {
    console.error('bKash callback error:', error);
    return Response.redirect(new URL('/reseller/wallet/error', req.url));
  }
}