import { Order } from '@/lib/models/order.model';
import { Cart } from '@/lib/models/cart.model';
import { generateOrderNumber } from '../utils';

export async function handleProductPayment(payment: any, transactionId: string, session: any) {
  try {
    // Create order from stored cart data
    const cartData = payment.metadata.cartData;
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = new Order({
      orderNumber,
      customer: payment.metadata.userId,
      items: cartData.items.map((item: any) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
        subProductName: item.subProductName,
        metadata: item.metadata
      })),
      total: cartData.total,
      status: 'processing',
      paymentStatus: 'paid',
      payment: {
        provider: 'bkash',
        transactionId,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.paymentId
      }
    });

    await order.save({ session });

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = transactionId;
    payment.orderId = order._id;
    await payment.save({ session });

    // Clear user's cart
    await Cart.findOneAndDelete(
      { user: payment.metadata.userId },
      { session }
    );

    return order._id;
  } catch (error) {
    console.error('Error handling product payment:', error);
    throw error;
  }
}