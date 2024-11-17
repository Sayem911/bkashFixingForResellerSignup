'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EditProductDialog } from './EditProductDialog';
import { BulkActions } from './BulkActions';
import { Loader2, Zap, Star } from 'lucide-react';
import Image from 'next/image';

interface ProductListProps {
  search: string;
  category?: string;
}

export function ProductList({ search, category }: ProductListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const response = await fetch(`/api/reseller/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      setSelectedProducts([]); // Clear selection when products change
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAllProducts = () => {
    setSelectedProducts(prev => 
      prev.length === products.length
        ? []
        : products.map(p => p._id)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedProducts.length === products.length}
            onCheckedChange={toggleAllProducts}
          />
          <span className="text-sm text-muted-foreground">
            {selectedProducts.length} selected
          </span>
        </div>
        <BulkActions
          selectedProducts={selectedProducts}
          onUpdate={fetchProducts}
          minMarkup={10}
          maxMarkup={50}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product._id} className="overflow-hidden">
            <div className="relative">
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedProducts.includes(product._id)}
                  onCheckedChange={() => toggleProductSelection(product._id)}
                />
              </div>
              <div className="relative h-48">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {product.instantDelivery && (
                    <Badge variant="secondary">
                      <Zap className="w-3 h-3 mr-1" />
                      Instant
                    </Badge>
                  )}
                  {product.featured && (
                    <Badge className="bg-yellow-500">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.region} • {product.category.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="space-y-2">
                {product.subProducts.map((subProduct: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{subProduct.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(subProduct.price * (1 + product.markup/100), 'USD')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(subProduct.price, 'USD')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <Badge variant={product.enabled ? 'default' : 'secondary'}>
                  {product.enabled ? 'Active' : 'Disabled'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProduct(product)}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={(updatedProduct) => {
            setProducts(products.map(p => 
              p._id === updatedProduct._id ? updatedProduct : p
            ));
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}