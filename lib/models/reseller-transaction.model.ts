import mongoose, { Schema, Document } from 'mongoose';

export interface IResellerTransaction extends Document {
  resellerId: mongoose.Types.ObjectId;
  type: 'order_profit' | 'wallet_topup' | 'refund' | 'withdrawal';
  amount: number;
  balance: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: {
    orderId?: mongoose.Types.ObjectId;
    paymentId?: string;
    withdrawalId?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResellerTransactionSchema = new Schema<IResellerTransaction>({
  resellerId: { type: Schema.Types.ObjectId, ref: 'Reseller', required: true },
  type: {
    type: String,
    enum: ['order_profit', 'wallet_topup', 'refund', 'withdrawal'],
    required: true
  },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
ResellerTransactionSchema.index({ resellerId: 1, createdAt: -1 });
ResellerTransactionSchema.index({ resellerId: 1, type: 1 });
ResellerTransactionSchema.index({ status: 1 });

export const ResellerTransaction = mongoose.models.ResellerTransaction || 
  mongoose.model<IResellerTransaction>('ResellerTransaction', ResellerTransactionSchema);