'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShopProduct, getWhatsAppOrderLink } from '@/lib/shop-config'
import { MessageCircle, X } from 'lucide-react'
import Image from 'next/image'

interface ShopProductDialogProps {
  product: ShopProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShopProductDialog({
  product,
  open,
  onOpenChange,
}: ShopProductDialogProps) {
  const t = useTranslations('shop')

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.fullName}</DialogTitle>
        </DialogHeader>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative aspect-square bg-secondary">
            <Image
              src={product.image}
              alt={product.fullName}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/images/shop/placeholder.jpg'
              }}
            />

            {/* Featured badge */}
            {product.featured && (
              <Badge className="absolute top-4 left-4 bg-teal-500 text-white">
                {t('product.featured')}
              </Badge>
            )}

            {/* Out of stock overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Badge
                  variant="outline"
                  className="text-muted-foreground border-muted-foreground text-lg px-4 py-2"
                >
                  {t('product.outOfStock')}
                </Badge>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 flex flex-col">
            {/* Brand */}
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {product.brand}
            </p>

            {/* Name */}
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {product.fullName}
            </h2>

            {/* Price */}
            <p className="text-3xl font-bold text-foreground mb-4">
              RM{product.price.toFixed(0)}
            </p>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground mb-4">{product.description}</p>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('product.availableColors')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <Badge
                      key={color}
                      variant="outline"
                      className="text-muted-foreground border-border"
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('product.availableSizes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Badge
                      key={size}
                      variant="outline"
                      className="text-muted-foreground border-border"
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('product.specifications')}
                </p>
                <div className="space-y-1">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between text-sm border-b border-border py-1"
                    >
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Order Button */}
            <div className="mt-auto pt-4">
              <a
                href={getWhatsAppOrderLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-400 text-white rounded-full text-lg py-6"
                  disabled={!product.inStock}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('product.whatsappOrder')}
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t('product.whatsappHint')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
