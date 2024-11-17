import mongoose, { Schema, Document } from 'mongoose';

export interface IResellerOrder extends Document {
  resellerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  markup: number;
  cost: number;
  profit: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  processingStartedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResellerOrderSchema = new Schema<IResellerOrder>({
  resellerId: { type: Schema.Types.ObjectId, ref: 'Reseller', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  markup: { type: Number, required: true },
  cost: { type: Number, required: true },
  profit: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  processingStartedAt: Date,
  completedAt: Date,
  failureReason: String,
  refundReason: String,
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes
ResellerOrderSchema.index({ resellerId: 1, status: 1 });
ResellerOrderSchema.index({ orderId: 1 }, { unique: true });
ResellerOrderSchema.index({ createdAt: -1 });

export const ResellerOrder = mongoose.models.ResellerOrder || 
  mongoose.model<IResellerOrder>('ResellerOrder', ResellerOrderSchema);