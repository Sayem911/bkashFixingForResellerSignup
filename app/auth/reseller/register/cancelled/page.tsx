import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ResellerRegistrationCancelled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-yellow-500/10">
            <Ban className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Registration Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          You cancelled the registration process. No payment has been processed.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/reseller/register">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}