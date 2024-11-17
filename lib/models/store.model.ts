import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  reseller: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  logo?: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  settings: {
    defaultMarkup: number;
    minimumMarkup: number;
    maximumMarkup: number;
    autoFulfillment: boolean;
    lowBalanceAlert: number;
  };
  domainSettings?: {
    subdomain?: string;
    customDomain?: string;
    customDomainVerified?: boolean;
    dnsSettings?: {
      aRecord?: string;
      cnameRecord?: string;
      verificationToken?: string;
    };
  };
  status: 'pending' | 'active' | 'suspended';
  analytics: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>({
  reseller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  logo: String,
  theme: {
    primaryColor: { type: String, default: '#6366f1' },
    accentColor: { type: String, default: '#4f46e5' },
    backgroundColor: { type: String, default: '#000000' }
  },
  settings: {
    defaultMarkup: { type: Number, default: 20, min: 0 },
    minimumMarkup: { type: Number, default: 10, min: 0 },
    maximumMarkup: { type: Number, default: 50, min: 0 },
    autoFulfillment: { type: Boolean, default: true },
    lowBalanceAlert: { type: Number, default: 100, min: 0 }
  },
  domainSettings: {
    type: new Schema({
      subdomain: { type: String, unique: true, sparse: true },
      customDomain: { type: String, unique: true, sparse: true },
      customDomainVerified: { type: Boolean, default: false },
      dnsSettings: {
        aRecord: String,
        cnameRecord: String,
        verificationToken: String
      }
    }, { _id: false }),
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending',
    required: true
  },
  analytics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
StoreSchema.index({ reseller: 1 });
StoreSchema.index({ 'domainSettings.customDomain': 1 }, { unique: true, sparse: true });
StoreSchema.index({ 'domainSettings.subdomain': 1 }, { unique: true, sparse: true });
StoreSchema.index({ createdAt: -1 });

// Virtual for full domain
StoreSchema.virtual('fullDomain').get(function() {
  if (this.domainSettings?.customDomain && this.domainSettings?.customDomainVerified) {
    return this.domainSettings.customDomain;
  }
  return this.domainSettings?.subdomain ? `${this.domainSettings.subdomain}.yourdomain.com` : null;
});

export const Store = mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);