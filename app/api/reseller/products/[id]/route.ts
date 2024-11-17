import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ResellerProduct } from '@/lib/models/reseller-product.model';
import { User } from '@/lib/models/user.model';
import dbConnect from '@/lib/db/mongodb';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'reseller') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get reseller settings for markup validation
    const reseller = await User.findById(session.user.id);
    if (!reseller) {
      return Response.json(
        { error: 'Reseller not found' },
        { status: 404 }
      );
    }

    const { 
      markup, 
      enabled,
      customDescription,
      customGuide,
      customImportantNote
    } = await req.json();

    // Validate markup against reseller settings
    const minMarkup = reseller.wallet?.minMarkup || 1;
    const maxMarkup = reseller.wallet?.maxMarkup || 50;

    if (markup < minMarkup || markup > maxMarkup) {
      return Response.json({
        error: `Markup must be between ${minMarkup}% and ${maxMarkup}%`
      }, { status: 400 });
    }

    // Update or create reseller product
    const resellerProduct = await ResellerProduct.findOneAndUpdate(
      {
        resellerId: session.user.id,
        productId: params.id
      },
      {
        $set: {
          markup,
          enabled,
          customDescription,
          customGuide,
          customImportantNote
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    return Response.json(resellerProduct);
  } catch (error) {
    console.error('Failed to update product:', error);
    return Response.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}