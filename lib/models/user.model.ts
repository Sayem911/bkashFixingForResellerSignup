import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  image?: string;
  role: 'admin' | 'reseller' | 'customer';
  status: 'active' | 'pending' | 'suspended';
  
  // Profile Information
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Business Information (for resellers)
  businessName?: string;
  businessDescription?: string;
  domain?: string;
  businessAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Wallet & Financial
  wallet: {
    balance: number;
    currency: string;
    defaultMarkup: number; // Default markup percentage for resellers
    minMarkup: number; // Minimum allowed markup
    maxMarkup: number; // Maximum allowed markup
    transactions: Array<{
      type: 'credit' | 'debit';
      amount: number;
      description: string;
      status: 'pending' | 'completed' | 'failed';
      createdAt: Date;
    }>;
  };
  
  // Product Pricing (for resellers)
  productPricing: {
    [productId: string]: {
      markup: number;
      enabled: boolean;
      customPrice?: number;
    };
  };
  
  // Statistics & Metrics
  statistics: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit?: number;
    lastOrderDate?: Date;
    averageOrderValue?: number;
  };
  
  // Preferences
  preferences: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      push: boolean;
      orderUpdates: boolean;
      promotions: boolean;
    };
    theme: 'light' | 'dark' | 'system';
  };
  
  // Security
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: Date;
    loginAttempts: number;
    lastLogin?: Date;
    devices: Array<{
      deviceId: string;
      deviceType: string;
      lastAccess: Date;
      location?: string;
    }>;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  // Basic Information
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: String,
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  image: String,
  role: {
    type: String,
    enum: ['admin', 'reseller', 'customer'],
    default: 'customer',
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'active',
  },

  // Profile Information
  phoneNumber: String,
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },

  // Business Information
  businessName: String,
  businessDescription: String,
  domain: String,
  businessAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },

  // Wallet & Financial
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    defaultMarkup: { type: Number, default: 20 }, // 20% default markup
    minMarkup: { type: Number, default: 10 }, // 10% minimum markup
    maxMarkup: { type: Number, default: 50 }, // 50% maximum markup
    transactions: [{
      type: { type: String, enum: ['credit', 'debit'] },
      amount: Number,
      description: String,
      status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      createdAt: { type: Date, default: Date.now }
    }]
  },

  // Product Pricing
  productPricing: {
    type: Map,
    of: {
      markup: { type: Number, default: 20 }, // Default to 20% markup
      enabled: { type: Boolean, default: true },
      customPrice: Number
    },
    default: {}
  },

  // Statistics & Metrics
  statistics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalProfit: Number,
    lastOrderDate: Date,
    averageOrderValue: Number
  },

  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true }
    },
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },

  // Security
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    lastPasswordChange: Date,
    loginAttempts: { type: Number, default: 0 },
    lastLogin: Date,
    devices: [{
      deviceId: String,
      deviceType: String,
      lastAccess: { type: Date, default: Date.now },
      location: String
    }]
  }
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ 'wallet.balance': 1 });
UserSchema.index({ 'statistics.totalOrders': -1 });
UserSchema.index({ createdAt: -1 });

// Methods
UserSchema.methods.updateWalletBalance = async function(amount: number, type: 'credit' | 'debit', description: string) {
  const transaction = {
    type,
    amount,
    description,
    status: 'completed',
    createdAt: new Date()
  };

  this.wallet.balance = type === 'credit' 
    ? this.wallet.balance + amount 
    : this.wallet.balance - amount;
  
  this.wallet.transactions.push(transaction);
  await this.save();
  
  return this.wallet.balance;
};

// Method to set product markup
UserSchema.methods.setProductMarkup = async function(productId: string, markup: number) {
  if (markup < this.wallet.minMarkup || markup > this.wallet.maxMarkup) {
    throw new Error(`Markup must be between ${this.wallet.minMarkup}% and ${this.wallet.maxMarkup}%`);
  }

  this.productPricing.set(productId, {
    markup,
    enabled: true
  });

  await this.save();
  return this.productPricing.get(productId);
};

// Virtual fields
UserSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

UserSchema.virtual('isReseller').get(function() {
  return this.role === 'reseller';
});

UserSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Export the model
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);