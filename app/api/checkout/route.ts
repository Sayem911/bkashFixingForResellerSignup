import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Cart } from '@/lib/models/cart.model';
import { initializePayment } from '@/lib/payment';
import dbConnect from '@/lib/db/mongodb';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: session.user.id }).populate(
      'items.product'
    );

    if (!cart || cart.items.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Initialize payment
    const paymentResult = await initializePayment({
      type: 'order',
      userId: session.user.id,
      amount: cart.total,
      cartData: cart.toJSON()
    });

    return Response.json({
      paymentId: paymentResult.paymentId,
      bkashURL: paymentResult.bkashURL
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process checkout',
      },
      { status: 500 }
    );
  }
}