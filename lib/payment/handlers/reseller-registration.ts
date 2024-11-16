import { User } from '@/lib/models/user.model';
import { Store } from '@/lib/models/store.model';
import bcrypt from 'bcryptjs';

export async function handleResellerRegistration(payment: any, transactionId: string, session: any) {
  try {
    const registrationData = payment.metadata.registrationData;
    if (!registrationData) {
      throw new Error('Registration data not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registrationData.password, 12);

    // Create reseller user
    const user = new User({
      email: registrationData.email,
      password: hashedPassword,
      name: registrationData.name,
      role: 'reseller',
      status: 'pending',
      businessName: registrationData.businessName,
      wallet: {
        balance: 0,
        currency: 'BDT',
        transactions: []
      }
    });

    await user.save({ session });

    // Generate unique subdomain
    const baseSubdomain = registrationData.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const uniqueSubdomain = `${baseSubdomain}-${Date.now()}`;

    // Create store
    const store = new Store({
      reseller: user._id,
      name: registrationData.businessName,
      domain: registrationData.domain || null,
      subdomain: uniqueSubdomain,
      status: 'pending',
      settings: {
        defaultMarkup: 20,
        minimumMarkup: 10,
        maximumMarkup: 50,
        autoFulfillment: true,
        lowBalanceAlert: 1000
      }
    });

    await store.save({ session });

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = transactionId;
    await payment.save({ session });

    return user._id;
  } catch (error) {
    console.error('Error handling reseller registration:', error);
    throw error;
  }
}