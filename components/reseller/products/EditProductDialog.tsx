'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface EditProductDialogProps {
  product: any;
  onClose: () => void;
  onUpdate: (product: any) => void;
}

export function EditProductDialog({ product, onClose, onUpdate }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    markup: product?.markup || 20,
    enabled: product?.enabled ?? true,
    customDescription: product?.customDescription || product?.description || '',
    customGuide: product?.customGuide || product?.guide || '',
    customImportantNote: product?.customImportantNote || product?.importantNote || '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/reseller/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });

      onUpdate(updatedProduct);
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const calculateSellingPrice = (price: number) => {
    return price * (1 + formData.markup / 100);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product Settings</DialogTitle>
          <DialogDescription>
            Customize product details and pricing for your store
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="pricing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Additional Details</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-2">
                <Label>Markup Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.markup}
                    onChange={(e) => setFormData({
                      ...formData,
                      markup: parseFloat(e.target.value)
                    })}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Price Preview</Label>
                <div className="space-y-2">
                  {product.subProducts.map((subProduct: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                      <span className="text-sm">{subProduct.name}</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(calculateSellingPrice(subProduct.price), 'USD')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Cost: {formatCurrency(subProduct.price, 'USD')}
                        </div>
                        <div className="text-sm text-green-600">
                          Profit: {formatCurrency(calculateSellingPrice(subProduct.price) - subProduct.price, 'USD')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <div className="space-y-2">
                <Label>Product Description</Label>
                <Textarea
                  value={formData.customDescription}
                  onChange={(e) => setFormData({
                    ...formData,
                    customDescription: e.target.value
                  })}
                  placeholder={product.description}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  Customize the product description for your store
                </p>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label>Usage Guide</Label>
                <Textarea
                  value={formData.customGuide}
                  onChange={(e) => setFormData({
                    ...formData,
                    customGuide: e.target.value
                  })}
                  placeholder={product.guide}
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Important Note</Label>
                <Input
                  value={formData.customImportantNote}
                  onChange={(e) => setFormData({
                    ...formData,
                    customImportantNote: e.target.value
                  })}
                  placeholder={product.importantNote}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Product Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this product in your store
                  </p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    enabled: checked
                  })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}