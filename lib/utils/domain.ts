import { Store } from '@/lib/models/store.model';

export async function generateSubdomain(storeName: string): Promise<string> {
  if (!storeName) {
    throw new Error('Store name is required to generate subdomain');
  }

  // Convert store name to URL-friendly format
  let baseSubdomain = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);

  // If base subdomain is empty after sanitization, use a default
  if (!baseSubdomain) {
    baseSubdomain = 'store';
  }

  let subdomain = baseSubdomain;
  let counter = 1;

  // Keep trying until we find an available subdomain
  while (true) {
    try {
      const exists = await Store.findOne({
        'domainSettings.subdomain': subdomain
      });

      if (!exists) {
        return subdomain;
      }

      // Try next number
      subdomain = `${baseSubdomain}${counter}`;
      counter++;

      // Prevent infinite loop
      if (counter > 1000) {
        throw new Error('Unable to generate unique subdomain');
      }
    } catch (error) {
      console.error('Error generating subdomain:', error);
      throw error;
    }
  }
}