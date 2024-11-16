import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccess({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Order Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your order #{params.id} has been confirmed and is being processed.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href={`/orders/${params.id}`}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              View Order Details
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}