import mongoose, { Schema, Document } from 'mongoose';

export interface IReseller extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  businessDescription?: string;
  status: 'pending' | 'active' | 'suspended';
  registrationDate: Date;
  approvalDate?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  suspensionReason?: string;
  suspendedBy?: mongoose.Types.ObjectId;
  suspendedAt?: Date;
  settings: {
    defaultMarkup: number;
    minimumMarkup: number;
    maximumMarkup: number;
    autoFulfillment: boolean;
    lowBalanceAlert: number;
  };
  statistics: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    lastOrderDate?: Date;
    averageOrderValue?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResellerSchema = new Schema<IReseller>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  businessDescription: String,
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending',
    required: true
  },
  registrationDate: { type: Date, default: Date.now },
  approvalDate: Date,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  suspensionReason: String,
  suspendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  suspendedAt: Date,
  settings: {
    defaultMarkup: { type: Number, default: 20, min: 0 },
    minimumMarkup: { type: Number, default: 10, min: 0 },
    maximumMarkup: { type: Number, default: 50, min: 0 },
    autoFulfillment: { type: Boolean, default: true },
    lowBalanceAlert: { type: Number, default: 100, min: 0 }
  },
  statistics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    lastOrderDate: Date,
    averageOrderValue: Number
  }
}, {
  timestamps: true
});

// Indexes
ResellerSchema.index({ userId: 1 }, { unique: true });
ResellerSchema.index({ status: 1 });
ResellerSchema.index({ businessName: 1 });
ResellerSchema.index({ 'statistics.totalRevenue': -1 });

export const Reseller = mongoose.models.Reseller || mongoose.model<IReseller>('Reseller', ResellerSchema);