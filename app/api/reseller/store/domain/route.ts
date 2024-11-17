import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Store } from '@/lib/models/store.model';
import { generateSubdomain } from '@/lib/utils/domain';
import dbConnect from '@/lib/db/mongodb';

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

    const { subdomain, customDomain } = await req.json();
    const store = await Store.findOne({ reseller: session.user.id });

    if (!store) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Update subdomain
    if (subdomain && subdomain !== store.domainSettings?.subdomain) {
      // Check if subdomain is available
      const exists = await Store.findOne({
        'domainSettings.subdomain': subdomain,
        _id: { $ne: store._id }
      });

      if (exists) {
        return Response.json(
          { error: 'Subdomain is already taken' },
          { status: 400 }
        );
      }

      store.domainSettings = {
        ...store.domainSettings,
        subdomain
      };
    }

    // Update custom domain
    if (customDomain !== undefined) {
      if (customDomain) {
        // Validate domain format
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
        if (!domainRegex.test(customDomain)) {
          return Response.json(
            { error: 'Invalid domain format' },
            { status: 400 }
          );
        }

        // Check if domain is already in use
        const exists = await Store.findOne({
          'domainSettings.customDomain': customDomain,
          _id: { $ne: store._id }
        });

        if (exists) {
          return Response.json(
            { error: 'Domain is already in use' },
            { status: 400 }
          );
        }

        store.domainSettings = {
          ...store.domainSettings,
          customDomain,
          customDomainVerified: false,
          dnsSettings: {
            aRecord: 'your-server-ip',
            cnameRecord: 'your-cname-target',
            verificationToken: Math.random().toString(36).substring(2)
          }
        };
      } else {
        // Remove custom domain
        store.domainSettings = {
          ...store.domainSettings,
          customDomain: undefined,
          customDomainVerified: false,
          dnsSettings: undefined
        };
      }
    }

    await store.save();

    return Response.json(store);
  } catch (error) {
    console.error('Failed to update domain settings:', error);
    return Response.json(
      { error: 'Failed to update domain settings' },
      { status: 500 }
    );
  }
}