import { NextRequest } from 'next/server';
import { initializePayment } from '@/lib/payment';
import { User } from '@/lib/models/user.model';
import dbConnect from '@/lib/db/mongodb';

const REGISTRATION_FEE = 1000; // BDT

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const data = await req.json();

    // Validate required fields
    if (!data.email || !data.password || !data.name || !data.businessName) {
      return Response.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Initialize registration payment
    const paymentResult = await initializePayment({
      type: 'reseller_registration',
      amount: REGISTRATION_FEE,
      registrationData: {
        email: data.email,
        password: data.password,
        name: data.name,
        businessName: data.businessName
      },
      description: 'Reseller Registration Fee'
    });

    return Response.json({
      message: 'Registration initiated',
      paymentId: paymentResult.paymentId,
      bkashURL: paymentResult.bkashURL
    });
  } catch (error) {
    console.error('Reseller registration error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate registration' },
      { status: 500 }
    );
  }
}