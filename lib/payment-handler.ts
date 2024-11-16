import { createBkashPayment, executeBkashPayment } from './bkash';
import { Payment } from './models/payment.model';
import { Cart } from './models/cart.model';
import { Order } from './models/order.model';
import { User } from './models/user.model';
import { WalletTransaction } from './models/wallet-transaction.model';

export type PaymentType = 'product' | 'wallet_topup';

interface PaymentMetadata {
  userId: string;
  type: PaymentType;
  cartData?: any;
  amount?: number;
  description?: string;
}

export async function initializePayment(metadata: PaymentMetadata) {
  try {
    // Create bKash payment
    const bkashPayment = await createBkashPayment(
      metadata.type === 'product' ? metadata.cartData.total : metadata.amount!,
      `${metadata.type}-${metadata.userId}-${Date.now()}`
    );

    // Create payment record
    const payment = await Payment.create({
      amount: metadata.type === 'product' ? metadata.cartData.total : metadata.amount!,
      currency: 'BDT',
      provider: 'bkash',
      paymentId: bkashPayment.paymentID,
      status: 'pending',
      metadata: {
        type: metadata.type,
        userId: metadata.userId,
        cartData: metadata.type === 'product' ? metadata.cartData : undefined,
        description: metadata.description
      }
    });

    return {
      paymentId: payment._id,
      bkashURL: bkashPayment.bkashURL
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
}

export async function handlePaymentCallback(paymentId: string, status: string) {
  try {
    // Find payment record
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if payment is already processed
    if (payment.status === 'completed') {
      return {
        success: true,
        redirectUrl: getRedirectUrl(payment.metadata.type, 'success', payment._id)
      };
    }

    if (status === 'success') {
      try {
        // Execute payment
        const paymentResult = await executeBkashPayment(paymentId);
        
        if (paymentResult.statusCode === '0000' && 
            paymentResult.transactionStatus === 'Completed') {
          
          // Start transaction
          const session = await Payment.startSession();
          session.startTransaction();

          try {
            // Handle payment based on type
            if (payment.metadata.type === 'product') {
              await handleProductPayment(payment, paymentResult.trxID, session);
            } else if (payment.metadata.type === 'wallet_topup') {
              await handleWalletTopup(payment, paymentResult.trxID, session);
            }

            await session.commitTransaction();
            return {
              success: true,
              redirectUrl: getRedirectUrl(payment.metadata.type, 'success', payment._id)
            };
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        }
      } catch (error) {
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
      // Update payment status
      payment.status = 'failed';
      payment.metadata = {
        ...payment.metadata,
        cancelledAt: new Date(),
        cancelReason: status === 'cancel' ? 'User cancelled the transaction' : 'Payment failed'
      };
      await payment.save();

      return {
        success: false,
        redirectUrl: getRedirectUrl(payment.metadata.type, status === 'cancel' ? 'cancelled' : 'failed', payment._id)
      };
    }

    return {
      success: false,
      redirectUrl: getRedirectUrl(payment.metadata.type, 'error')
    };
  } catch (error) {
    console.error('Payment callback error:', error);
    return {
      success: false,
      redirectUrl: getRedirectUrl(payment.metadata.type, 'error')
    };
  }
}

async function handleProductPayment(payment: any, transactionId: string, session: any) {
  // Create order from stored cart data
  const cartData = payment.metadata.cartData;
  const orderNumber = await generateOrderNumber();

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
}

async function handleWalletTopup(payment: any, transactionId: string, session: any) {
  // Get user
  const user = await User.findById(payment.metadata.userId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  // Create wallet transaction
  const transaction = new WalletTransaction({
    user: payment.metadata.userId,
    type: 'credit',
    amount: payment.amount,
    balance: user.wallet.balance + payment.amount,
    description: payment.metadata.description || 'Wallet Top Up',
    status: 'completed',
    metadata: {
      paymentId: payment.paymentId,
      transactionId,
      provider: 'bkash'
    }
  });

  await transaction.save({ session });

  // Update user's wallet balance
  user.wallet.balance += payment.amount;
  user.wallet.transactions.push({
    type: 'credit',
    amount: payment.amount,
    description: payment.metadata.description || 'Wallet Top Up',
    status: 'completed'
  });

  await user.save({ session });

  // Update payment status
  payment.status = 'completed';
  payment.transactionId = transactionId;
  await payment.save({ session });
}

function getRedirectUrl(type: PaymentType, status: string, paymentId?: string) {
  const baseUrl = type === 'product' ? '/orders' : '/reseller/wallet';
  
  switch (status) {
    case 'success':
      return `${baseUrl}/${paymentId}/success`;
    case 'cancelled':
      return `${baseUrl}/cancelled`;
    case 'failed':
      return `${baseUrl}/failed`;
    default:
      return `${baseUrl}/error`;
  }
}

async function generateOrderNumber() {
  const count = await Order.countDocuments();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = (count + 1).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${sequence}`;
}