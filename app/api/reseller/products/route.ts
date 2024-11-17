import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Product } from '@/lib/models/product.model';
import { ResellerProduct } from '@/lib/models/reseller-product.model';
import { User } from '@/lib/models/user.model';
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    // Get reseller
    const reseller = await User.findById(session.user.id);
    if (!reseller) {
      return Response.json(
        { error: 'Reseller not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = {};
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    // Get base products
    const products = await Product.find(query);

    // Get reseller customizations
    const resellerProducts = await ResellerProduct.find({
      resellerId: session.user.id,
      productId: { $in: products.map(p => p._id) }
    });

    // Combine data
    const combinedProducts = products.map(product => {
      const resellerProduct = resellerProducts.find(
        rp => rp.productId.toString() === product._id.toString()
      );

      return {
        ...product.toObject(),
        _id: product._id,
        markup: resellerProduct?.markup || reseller.wallet?.defaultMarkup || 20,
        enabled: resellerProduct?.enabled ?? true,
        customDescription: resellerProduct?.customDescription || product.description,
        customGuide: resellerProduct?.customGuide || product.guide,
        customRegion: resellerProduct?.customRegion || product.region,
        customImportantNote: resellerProduct?.customImportantNote || product.importantNote,
        customFields: resellerProduct?.customFields || product.customFields,
        subProducts: product.subProducts.map(sp => ({
          ...sp.toObject(),
          name: sp.name,
          price: sp.price,
          originalPrice: sp.originalPrice,
          stockQuantity: resellerProduct?.customSubProducts?.find(
            csp => csp.originalId === sp._id.toString()
          )?.stockQuantity || undefined,
          enabled: resellerProduct?.customSubProducts?.find(
            csp => csp.originalId === sp._id.toString()
          )?.enabled ?? true,
          inStock: sp.inStock
        })),
        featured: resellerProduct?.featured || false,
        displayOrder: resellerProduct?.displayOrder || 0
      };
    });

    return Response.json(combinedProducts);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return Response.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}