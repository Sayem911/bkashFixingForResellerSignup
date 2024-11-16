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
  paymentSettings: {
    hasMerchantAccount: boolean;
    merchantUsername: string;
    merchantPassword: string;
    appKey: string;
    appSecret: string;
    sandboxMode: boolean;
    updatedAt?: Date;
  };
  domainSettings: {
    customDomain?: string;
    customDomainVerified: boolean;
    subdomain: string;
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
  paymentSettings: {
    hasMerchantAccount: { type: Boolean, default: false },
    merchantUsername: { type: String, default: 'default' },
    merchantPassword: { type: String, default: 'default' },
    appKey: { type: String, default: 'default' },
    appSecret: { type: String, default: 'default' },
    sandboxMode: { type: Boolean, default: true },
    updatedAt: Date
  },
  domainSettings: {
    customDomain: { type: String },
    customDomainVerified: { type: Boolean, default: false },
    subdomain: { 
      type: String, 
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
    },
    dnsSettings: {
      aRecord: String,
      cnameRecord: String,
      verificationToken: String
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'active', 'suspended'],
      message: '{VALUE} is not a valid status'
    },
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

// Pre-save middleware to ensure subdomain is set
StoreSchema.pre('save', async function(next) {
  if (!this.domainSettings.subdomain) {
    throw new Error('Subdomain is required');
  }
  next();
});

// Indexes
StoreSchema.index({ reseller: 1 });
StoreSchema.index({ 'domainSettings.customDomain': 1 });
StoreSchema.index({ 'domainSettings.subdomain': 1 }, { unique: true });
StoreSchema.index({ createdAt: -1 });

// Virtual for full domain
StoreSchema.virtual('fullDomain').get(function() {
  if (this.domainSettings.customDomain && this.domainSettings.customDomainVerified) {
    return this.domainSettings.customDomain;
  }
  return `${this.domainSettings.subdomain}.xyz.com`;
});

export const Store = mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);