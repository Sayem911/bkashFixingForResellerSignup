import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ResellerProduct } from '@/lib/models/reseller-product.model';
import { Product } from '@/lib/models/product.model';
import { Reseller } from '@/lib/models/reseller.model';
import dbConnect from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'reseller') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get featured products
    const resellerProducts = await ResellerProduct.find({
      resellerId: reseller._id,
      featured: true
    });

    // Get base products
    const products = await Product.find({
      _id: { $in: resellerProducts.map(rp => rp.productId) }
    });

    // Combine data
    const featuredProducts = products.map(product => {
      const resellerProduct = resellerProducts.find(
        rp => rp.productId.toString() === product._id.toString()
      );

      return {
        ...product.toObject(),
        markup: resellerProduct?.markup || reseller.settings.defaultMarkup,
        enabled: resellerProduct?.enabled ?? true,
        description: resellerProduct?.customDescription || product.description,
        guide: resellerProduct?.customGuide || product.guide,
        region: resellerProduct?.customRegion || product.region,
        importantNote: resellerProduct?.customImportantNote || product.importantNote,
        customFields: resellerProduct?.customFields || product.customFields,
        subProducts: product.subProducts.map(sp => {
          const customSp = resellerProduct?.customSubProducts?.find(
            csp => csp.originalId === sp._id.toString()
          );
          return {
            ...sp,
            name: customSp?.name || sp.name,
            enabled: customSp?.enabled ?? true,
            stockQuantity: customSp?.stockQuantity
          };
        }),
        featured: true,
        displayOrder: resellerProduct?.displayOrder || 0
      };
    });

    return Response.json(featuredProducts);
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return Response.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}