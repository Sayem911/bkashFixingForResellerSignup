'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Zap, Star, Package } from 'lucide-react';
import { EditProductDialog } from './EditProductDialog';
import { StockManagement } from './StockManagement';
import Image from 'next/image';

interface ProductCardProps {
  product: any;
  onUpdate: () => void;
  selected?: boolean;
  onSelect?: () => void;
}

export function ProductCard({ product, onUpdate, selected, onSelect }: ProductCardProps) {
  const hasLowStock = product.subProducts.some((sp: any) => 
    sp.stockQuantity !== undefined && sp.stockQuantity < 10
  );

  return (
    <Card className={`overflow-hidden ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="relative">
        {onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        )}
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
              <div className="flex items-center gap-2">
                <span className="text-sm">{subProduct.name}</span>
                {subProduct.stockQuantity !== undefined && (
                  <Badge variant={subProduct.stockQuantity < 10 ? 'destructive' : 'secondary'}>
                    {subProduct.stockQuantity} left
                  </Badge>
                )}
              </div>
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

        <div className="flex justify-between items-center gap-2">
          <Badge variant={product.enabled ? 'default' : 'secondary'}>
            {product.enabled ? 'Active' : 'Disabled'}
          </Badge>
          <div className="flex gap-2">
            <StockManagement product={product} onUpdate={onUpdate} />
            <EditProductDialog product={product} onUpdate={onUpdate} />
          </div>
        </div>

        {hasLowStock && (
          <Alert variant="destructive" className="mt-2">
            <Package className="h-4 w-4" />
            <AlertDescription>Low stock warning</AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}