import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initializePayment } from '@/lib/payment';
import dbConnect from '@/lib/db/mongodb';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'reseller') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return Response.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Initialize payment for wallet top-up
    const paymentResult = await initializePayment({
      type: 'wallet_topup',
      userId: session.user.id,
      amount,
      metadata: {
        description: 'Wallet Top Up'
      }
    });

    return Response.json({
      paymentId: paymentResult.paymentId,
      bkashURL: paymentResult.bkashURL
    });
  } catch (error) {
    console.error('Failed to initiate top-up:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate top-up' },
      { status: 500 }
    );
  }
}