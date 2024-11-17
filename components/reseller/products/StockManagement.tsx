'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Package } from 'lucide-react';

interface StockManagementProps {
  product: any;
  onUpdate: () => void;
}

export function StockManagement({ product, onUpdate }: StockManagementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [stockQuantities, setStockQuantities] = useState<Record<string, number | undefined>>(
    product.subProducts.reduce((acc: any, sp: any) => ({
      ...acc,
      [sp._id]: sp.stockQuantity
    }), {})
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Update stock quantities for each variant
      await Promise.all(
        Object.entries(stockQuantities).map(([variantId, quantity]) =>
          fetch('/api/reseller/products/stock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product._id,
              variantId,
              stockQuantity: quantity
            }),
          })
        )
      );

      toast({
        title: 'Success',
        description: 'Stock quantities updated successfully',
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update stock:', error);
      setError(error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Manage Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Stock</DialogTitle>
          <DialogDescription>
            Update stock quantities for product variants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {product.subProducts.map((variant: any) => (
            <div key={variant._id} className="space-y-2">
              <Label>{variant.name}</Label>
              <Input
                type="number"
                min="0"
                value={stockQuantities[variant._id] ?? ''}
                onChange={(e) => setStockQuantities({
                  ...stockQuantities,
                  [variant._id]: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Leave empty for unlimited"
              />
            </div>
          ))}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}