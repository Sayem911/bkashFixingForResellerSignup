import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ResellerProduct } from '@/lib/models/reseller-product.model';
import { Reseller } from '@/lib/models/reseller.model';
import dbConnect from '@/lib/db/mongodb';

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'reseller') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId, variantId, stockQuantity } = await req.json();
    if (!productId || !variantId) {
      return Response.json(
        { error: 'Product ID and variant ID are required' },
        { status: 400 }
      );
    }

    // Get reseller
    const reseller = await Reseller.findOne({ userId: session.user.id });
    if (!reseller) {
      return Response.json(
        { error: 'Reseller not found' },
        { status: 404 }
      );
    }

    // Update stock quantity
    const result = await ResellerProduct.findOneAndUpdate(
      {
        resellerId: reseller._id,
        productId,
        'customSubProducts.originalId': variantId
      },
      {
        $set: {
          'customSubProducts.$.stockQuantity': stockQuantity
        }
      },
      { new: true }
    );

    if (!result) {
      return Response.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error('Failed to update stock:', error);
    return Response.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}