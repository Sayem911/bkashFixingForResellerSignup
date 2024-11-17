'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function CheckoutStatus({ 
  params 
}: { 
  params: { paymentId: string } 
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let checkInterval: NodeJS.Timeout;
    let bkashWindowOpened = false;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: params.paymentId })
        });

        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        const data = await response.json();

        if (!isMounted) return;

        // Handle different payment statuses
        switch (data.status) {
          case 'completed':
            clearInterval(checkInterval);
            router.push(data.redirectUrl);
            return true;

          case 'failed':
          case 'cancelled':
            clearInterval(checkInterval);
            router.push(data.redirectUrl);
            return true;

          case 'pending':
            // Open bKash window only once
            if (data.bkashURL && !bkashWindowOpened) {
              bkashWindowOpened = true;
              window.location.href = data.bkashURL;
            }
            return false;

          default:
            return false;
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        if (isMounted) {
          clearInterval(checkInterval);
          router.push('/orders/error');
        }
        return true;
      }
    };

    // Initial check
    checkPaymentStatus().then(completed => {
      if (!completed && isMounted) {
        setLoading(false);
        // Set up polling only if payment is still pending
        checkInterval = setInterval(checkPaymentStatus, 3000);
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [params.paymentId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
        <p className="text-muted-foreground">
          {loading ? 'Initializing payment...' : 'Please complete your payment in the bKash window. Do not close this page.'}
        </p>
      </Card>
    </div>
  );
}