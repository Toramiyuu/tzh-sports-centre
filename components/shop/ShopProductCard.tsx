'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShopProduct } from '@/lib/shop-config'
import { Eye } from 'lucide-react'
import Image from 'next/image'

interface ShopProductCardProps {
  product: ShopProduct
  onViewDetails: (product: ShopProduct) => void
}

export function ShopProductCard({ product, onViewDetails }: ShopProductCardProps) {
  const t = useTranslations('shop')

  return (
    <Card className="group bg-card border-border overflow-hidden hover-lift cursor-pointer">
      {/* Product Image */}
      <div
        className="relative aspect-square bg-secondary overflow-hidden"
        onClick={() => onViewDetails(product)}
      >
        <Image
          src={product.image}
          alt={product.fullName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/images/shop/placeholder.jpg'
          }}
        />

        {/* Featured badge */}
        {product.featured && (
          <Badge className="absolute top-3 left-3 bg-[#1854d6] text-white">
            {t('product.featured')}
          </Badge>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="outline" className="text-muted-foreground border-muted-foreground">
              {t('product.outOfStock')}
            </Badge>
          </div>
        )}

        {/* Quick view button */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(product)
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            {t('product.quickView')}
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        {/* Brand */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {product.brand}
        </p>

        {/* Name */}
        <h3
          className="font-semibold text-foreground mb-2 line-clamp-2 cursor-pointer hover:text-[#0a2540] transition-colors"
          onClick={() => onViewDetails(product)}
        >
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-xl font-bold text-foreground mb-3">
          RM{product.price.toFixed(0)}
        </p>

        {/* Colors preview */}
        {product.colors && product.colors.length > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {product.colors.length} {product.colors.length === 1 ? t('product.color') : t('product.colors')}
          </p>
        )}

        {/* View Details Button */}
        <Button
          className="w-full bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full"
          onClick={() => onViewDetails(product)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {t('product.quickView')}
        </Button>
      </CardContent>
    </Card>
  )
}
