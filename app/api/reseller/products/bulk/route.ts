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

    const { productIds, updates } = await req.json();
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return Response.json(
        { error: 'No products selected' },
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

    // Validate markup if provided
    if (updates.markup !== undefined) {
      const { minimumMarkup, maximumMarkup } = reseller.settings;
      if (updates.markup < minimumMarkup || updates.markup > maximumMarkup) {
        return Response.json({
          error: `Markup must be between ${minimumMarkup}% and ${maximumMarkup}%`
        }, { status: 400 });
      }
    }

    // Update products
    const bulkOps = productIds.map(productId => ({
      updateOne: {
        filter: {
          resellerId: reseller._id,
          productId
        },
        update: {
          $set: updates
        },
        upsert: true
      }
    }));

    await ResellerProduct.bulkWrite(bulkOps);

    return Response.json({
      success: true,
      message: `Updated ${productIds.length} products`
    });
  } catch (error) {
    console.error('Failed to update products:', error);
    return Response.json(
      { error: 'Failed to update products' },
      { status: 500 }
    );
  }
}