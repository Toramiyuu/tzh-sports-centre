'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  allProducts?: ShopProduct[]
  onViewDetails?: (product: ShopProduct) => void
}

export function ShopProductDialog({
  product,
  open,
  onOpenChange,
  allProducts = [],
  onViewDetails,
}: ShopProductDialogProps) {
  const t = useTranslations('shop')
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | undefined>()
  const [selectedSize, setSelectedSize] = useState<string | undefined>()
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [isZooming, setIsZooming] = useState(false)

  // Build the images array: use product.images if available, otherwise fall back to [product.image]
  const allImages =
    product?.images && product.images.length > 1
      ? product.images
      : product
        ? [product.image]
        : []

  const hasMultipleImages = allImages.length > 1

  // Related products: same category, different product, max 4
  const relatedProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return []
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id && p.inStock)
      .slice(0, 4)
  }, [product, allProducts])

  // Reset index and selections when product changes or dialog opens
  useEffect(() => {
    setActiveIndex(0)
    if (product) {
      setSelectedColor(product.colors?.[0])
      setSelectedSize(product.sizes?.[0])
    }
  }, [product?.id, open])

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open || !hasMultipleImages) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      else if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, hasMultipleImages, goToPrev, goToNext])

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
  }, [goToNext, goToPrev])

  // Image zoom handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

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
            {/* Main Image with Zoom */}
            <div
              className="relative aspect-square bg-secondary overflow-hidden cursor-zoom-in"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
            >
              {/* Sliding track */}
              <div
                className="flex h-full transition-transform duration-300 ease-out will-change-transform"
                style={{
                  transform: `translateX(-${activeIndex * 100}%)`,
                }}
              >
                {allImages.map((img, idx) => (
                  <div key={idx} className="relative w-full h-full flex-shrink-0">
                    <Image
                      src={img}
                      alt={`${product.fullName} - ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-200"
                      style={
                        isZooming && idx === activeIndex
                          ? {
                              transform: 'scale(2)',
                              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                            }
                          : undefined
                      }
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={idx === 0}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/shop/placeholder.jpg'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Featured badge */}
              {product.featured && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground z-[1]">
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
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
                      idx === activeIndex
                        ? 'ring-2 ring-primary ring-offset-1 opacity-100'
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
                          ? 'bg-primary text-primary-foreground border-primary'
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
                          ? 'bg-primary text-primary-foreground border-primary'
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg py-6"
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

        {/* Related Products */}
        {relatedProducts.length > 0 && onViewDetails && (
          <div className="border-t border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              You may also like
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedProducts.map((rp) => (
                <button
                  key={rp.id}
                  onClick={() => onViewDetails(rp)}
                  className="group text-left"
                >
                  <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden mb-2">
                    <Image
                      src={rp.image}
                      alt={rp.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="150px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/shop/placeholder.jpg'
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase">{rp.brand}</p>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{rp.name}</p>
                  <p className="text-sm font-bold text-foreground">RM{rp.price.toFixed(0)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
