import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function ResellerRegistrationSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Registration Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your reseller application has been submitted successfully. Our admin team will review your application and notify you via email once approved.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/reseller/signin">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
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