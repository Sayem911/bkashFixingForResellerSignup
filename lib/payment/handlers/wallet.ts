import { User } from '@/lib/models/user.model';
import { WalletTransaction } from '@/lib/models/wallet-transaction.model';

export async function handleWalletTopup(payment: any, transactionId: string, session: any) {
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