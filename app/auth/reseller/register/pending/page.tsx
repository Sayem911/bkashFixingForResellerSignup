import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Home } from 'lucide-react';
import Link from 'next/link';

export default function ResellerRegistrationPending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-yellow-500/10">
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Registration Pending</h1>
        <p className="text-muted-foreground mb-6">
          Your reseller application has been submitted and is pending admin approval. We'll notify you via email once your account is approved.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Need help? Contact our{' '}
            <Link href="/support" className="text-primary hover:underline">
              support team
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}