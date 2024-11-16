import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ResellerRegistrationFailed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-red-500/10">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Registration Failed</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't process your registration payment. Please try again or contact support if the problem persists.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/reseller/register">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/support">Contact Support</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}