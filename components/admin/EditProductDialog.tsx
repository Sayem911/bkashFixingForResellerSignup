'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { ProductCategory, ProductPopularity } from '@/types/product';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    title: '',
    description: '',
    guide: '',
    guideEnabled: false,
    imageUrl: '',
    region: '',
    instantDelivery: false,
    importantNote: '',
    category: ProductCategory.GAME_TOPUP,
    popularity: ProductPopularity.REGULAR,
    countryCode: '',
    displayOrder: 0,
    subProducts: [],
    isIDBased: false,
    idFields: [{ label: 'Game ID' }],
    visibleToResellers: true
  });

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        guide: product.guide || '',
        guideEnabled: product.guideEnabled || false,
        imageUrl: product.imageUrl || '',
        region: product.region || '',
        instantDelivery: product.instantDelivery || false,
        importantNote: product.importantNote || '',
        category: product.category || ProductCategory.GAME_TOPUP,
        popularity: product.popularity || ProductPopularity.REGULAR,
        countryCode: product.countryCode || '',
        displayOrder: product.displayOrder || 0,
        subProducts: product.subProducts || [],
        isIDBased: product.isIDBased || false,
        idFields: product.idFields || [{ label: 'Game ID' }],
        visibleToResellers: product.visibleToResellers ?? true
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      onUpdate(updatedProduct);
      onClose();

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to your product here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="id-settings">ID Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProductCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country Code</Label>
                  <Input
                    id="countryCode"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="importantNote">Important Note</Label>
                <Input
                  id="importantNote"
                  value={formData.importantNote}
                  onChange={(e) => setFormData({ ...formData, importantNote: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guide">Usage Guide</Label>
                <Textarea
                  id="guide"
                  value={formData.guide}
                  onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="guideEnabled"
                  checked={formData.guideEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, guideEnabled: checked })}
                />
                <Label htmlFor="guideEnabled">Show Guide</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="instantDelivery"
                  checked={formData.instantDelivery}
                  onCheckedChange={(checked) => setFormData({ ...formData, instantDelivery: checked })}
                />
                <Label htmlFor="instantDelivery">Instant Delivery</Label>
              </div>
            </TabsContent>

            <TabsContent value="visibility" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Reseller Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Control whether resellers can see and sell this product
                  </p>
                </div>
                <Switch
                  checked={formData.visibleToResellers}
                  onCheckedChange={(checked) => setFormData({ ...formData, visibleToResellers: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="id-settings" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>ID-Based Product</Label>
                  <p className="text-sm text-muted-foreground">
                    Require game ID or similar identifier for purchase
                  </p>
                </div>
                <Switch
                  checked={formData.isIDBased}
                  onCheckedChange={(checked) => setFormData({ ...formData, isIDBased: checked })}
                />
              </div>

              {formData.isIDBased && (
                <div className="space-y-4 pt-4">
                  <Label>ID Field Labels</Label>
                  {formData.idFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          const newFields = [...formData.idFields];
                          newFields[index] = { label: e.target.value };
                          setFormData({ ...formData, idFields: newFields });
                        }}
                        placeholder="e.g., Game ID, Player ID"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const newFields = formData.idFields.filter((_, i) => i !== index);
                          setFormData({ ...formData, idFields: newFields });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        idFields: [...formData.idFields, { label: '' }]
                      });
                    }}
                  >
                    Add ID Field
                  </Button>
                </div>
              )}
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