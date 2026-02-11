'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | undefined>()
  const [selectedSize, setSelectedSize] = useState<string | undefined>()

  // Build the images array: use product.images if available, otherwise fall back to [product.image]
  const allImages =
    product?.images && product.images.length > 1
      ? product.images
      : product
        ? [product.image]
        : []

  const hasMultipleImages = allImages.length > 1

  // Reset index and selections when product changes or dialog opens
  useEffect(() => {
    setActiveIndex(0)
    setIsTransitioning(false)
    if (product) {
      setSelectedColor(product.colors?.[0])
      setSelectedSize(product.sizes?.[0])
    }
  }, [product?.id, open])

  const goToImage = useCallback(
    (index: number) => {
      if (index === activeIndex || isTransitioning) return
      setIsTransitioning(true)
      // Brief transition delay for fade effect
      setTimeout(() => {
        setActiveIndex(index)
        setTimeout(() => setIsTransitioning(false), 200)
      }, 150)
    },
    [activeIndex, isTransitioning]
  )

  const goToPrev = useCallback(() => {
    const newIndex = activeIndex === 0 ? allImages.length - 1 : activeIndex - 1
    goToImage(newIndex)
  }, [activeIndex, allImages.length, goToImage])

  const goToNext = useCallback(() => {
    const newIndex = activeIndex === allImages.length - 1 ? 0 : activeIndex + 1
    goToImage(newIndex)
  }, [activeIndex, allImages.length, goToImage])

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
          {/* Product Image Gallery */}
          <div className="flex flex-col">
            {/* Main Image */}
            <div className="relative aspect-square bg-secondary overflow-hidden">
              <Image
                key={allImages[activeIndex]}
                src={allImages[activeIndex]}
                alt={`${product.fullName} - ${activeIndex + 1}`}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/shop/placeholder.jpg'
                }}
              />

              {/* Featured badge */}
              {product.featured && (
                <Badge className="absolute top-4 left-4 bg-[#1854d6] text-white z-[1]">
                  {t('product.featured')}
                </Badge>
              )}

              {/* Out of stock overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[1]">
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-muted-foreground text-lg px-4 py-2"
                  >
                    {t('product.outOfStock')}
                  </Badge>
                </div>
              )}

              {/* Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-[2] rounded-full bg-background/70 hover:bg-background/90 p-1.5 text-foreground transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-[2] rounded-full bg-background/70 hover:bg-background/90 p-1.5 text-foreground transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-2 right-2 z-[2] bg-background/70 rounded-full px-2.5 py-0.5 text-xs text-foreground font-medium">
                    {activeIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {hasMultipleImages && (
              <div className="flex gap-1.5 p-2 overflow-x-auto bg-secondary/50">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToImage(idx)}
                    className={`relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
                      idx === activeIndex
                        ? 'ring-2 ring-[#1854d6] ring-offset-1 opacity-100'
                        : 'opacity-60 hover:opacity-90'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.fullName} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/shop/placeholder.jpg'
                      }}
                    />
                  </button>
                ))}
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

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('product.availableColors')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedColor === color
                          ? 'bg-[#1854d6] text-white border-[#1854d6]'
                          : 'bg-transparent text-muted-foreground border-border hover:border-foreground'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('product.availableSizes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedSize === size
                          ? 'bg-[#1854d6] text-white border-[#1854d6]'
                          : 'bg-transparent text-muted-foreground border-border hover:border-foreground'
                      }`}
                    >
                      {size}
                    </button>
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

            {/* Action Buttons */}
            <div className="mt-auto pt-4 space-y-3">
              {/* WhatsApp Order */}
              <a
                href={getWhatsAppOrderLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  className="w-full bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full text-lg py-6"
                  disabled={!product.inStock}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('product.whatsappOrder')}
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center">
                {t('product.whatsappHint')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
