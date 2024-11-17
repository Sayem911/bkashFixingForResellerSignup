'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Settings2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface BulkActionsProps {
  selectedProducts: string[];
  onUpdate: () => void;
  minMarkup: number;
  maxMarkup: number;
}

export function BulkActions({
  selectedProducts,
  onUpdate,
  minMarkup,
  maxMarkup,
}: BulkActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    markup: minMarkup,
    enabled: true,
    featured: false,
  });

  const handleSubmit = async () => {
    if (formData.markup < minMarkup || formData.markup > maxMarkup) {
      setError(`Markup must be between ${minMarkup}% and ${maxMarkup}%`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reseller/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          updates: formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update products');
      }

      toast({
        title: 'Success',
        description: 'Products updated successfully',
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update products:', error);
      setError(error instanceof Error ? error.message : 'Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={selectedProducts.length === 0}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Bulk Update ({selectedProducts.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Products</DialogTitle>
          <DialogDescription>
            Update settings for {selectedProducts.length} selected products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Markup Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={minMarkup}
                max={maxMarkup}
                step="0.1"
                value={formData.markup}
                onChange={(e) => setFormData({
                  ...formData,
                  markup: parseFloat(e.target.value)
                })}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Allowed range: {minMarkup}% - {maxMarkup}%
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Product Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable products
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

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Featured Products</Label>
              <p className="text-sm text-muted-foreground">
                Show products as featured
              </p>
            </div>
            <Switch
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                featured: checked
              })}
            />
          </div>

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
              Update Products
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}