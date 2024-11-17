import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Store } from '@/lib/models/store.model';
import { generateSubdomain } from '@/lib/utils/domain';
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

    const store = await Store.findOne({ reseller: session.user.id });
    if (!store) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return Response.json(store);
  } catch (error) {
    console.error('Failed to fetch store:', error);
    return Response.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'reseller') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if store already exists
    const existingStore = await Store.findOne({ reseller: session.user.id });
    if (existingStore) {
      return Response.json(
        { error: 'Store already exists' },
        { status: 400 }
      );
    }

    const { name, description, settings, theme } = await req.json();
    if (!name) {
      return Response.json(
        { error: 'Store name is required' },
        { status: 400 }
      );
    }

    // Generate subdomain from store name
    const subdomain = await generateSubdomain(name);

    // Create store
    const store = await Store.create({
      reseller: session.user.id,
      name,
      description,
      settings: {
        defaultMarkup: settings?.defaultMarkup || 20,
        minimumMarkup: settings?.minimumMarkup || 10,
        maximumMarkup: settings?.maximumMarkup || 50,
        autoFulfillment: settings?.autoFulfillment ?? true,
        lowBalanceAlert: settings?.lowBalanceAlert || 100
      },
      theme: {
        primaryColor: theme?.primaryColor || '#6366f1',
        accentColor: theme?.accentColor || '#4f46e5',
        backgroundColor: theme?.backgroundColor || '#000000'
      },
      domainSettings: {
        subdomain
      },
      status: 'active'
    });

    return Response.json(store);
  } catch (error) {
    console.error('Failed to create store:', error);
    return Response.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
}

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

    const data = await req.json();
    const store = await Store.findOne({ reseller: session.user.id });

    if (!store) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (data.name) store.name = data.name;
    if (data.description) store.description = data.description;
    if (data.theme) store.theme = { ...store.theme, ...data.theme };
    if (data.settings) store.settings = { ...store.settings, ...data.settings };

    await store.save();

    return Response.json(store);
  } catch (error) {
    console.error('Failed to update store:', error);
    return Response.json(
      { error: 'Failed to update store' },
      { status: 500 }
    );
  }
}