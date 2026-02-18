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
import { MessageCircle, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
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

  const colorImage = selectedColor && product?.colorImages?.[selectedColor]

  const allImages = useMemo(() => {
    if (!product) return []
    const base =
      product.images && product.images.length > 1
        ? product.images
        : [product.image]
    if (colorImage && !base.includes(colorImage)) {
      return [colorImage, ...base]
    }
    return base
  }, [product, colorImage])

  const hasMultipleImages = allImages.length > 1

  const relatedProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return []
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id && p.inStock)
      .slice(0, 4)
  }, [product, allProducts])

  const [prevResetKey, setPrevResetKey] = useState(`${product?.id}-${open}`)
  const resetKey = `${product?.id}-${open}`
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setActiveIndex(0)
    setSelectedColor(product?.colors?.[0])
    setSelectedSize(product?.sizes?.[0])
  }

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  useEffect(() => {
    if (!open || !hasMultipleImages) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      else if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, hasMultipleImages, goToPrev, goToNext])

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl h-[90vh] overflow-hidden bg-card border-border p-0 gap-0"
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{product.fullName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-rows-[2fr_3fr] lg:grid-rows-1 lg:grid-cols-2 h-full overflow-hidden">
          {/* ── Image Gallery ── */}
          <div className="flex flex-col bg-muted/30 min-h-0 overflow-hidden">
            {/* Main Image */}
            <div
              className="relative flex-1 min-h-0 overflow-hidden cursor-zoom-in"
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
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {allImages.map((img, idx) => (
                  <div key={idx} className="relative min-w-full h-full flex-shrink-0">
                    <Image
                      src={img}
                      alt={`${product.fullName} - ${idx + 1}`}
                      fill
                      className="object-contain p-4 transition-transform duration-200"
                      style={
                        isZooming && idx === activeIndex
                          ? {
                              transform: 'scale(2)',
                              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                              padding: 0,
                              objectFit: 'cover' as const,
                            }
                          : undefined
                      }
                      sizes="(max-width: 640px) 95vw, (max-width: 1024px) 672px, 50vw"
                      priority={idx === 0}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/shop/placeholder.jpg'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 z-[1] flex flex-col gap-1.5">
                {product.featured && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {t('product.featured')}
                  </Badge>
                )}
              </div>

              {/* Zoom hint */}
              {!isZooming && (
                <div className="absolute bottom-3 left-3 z-[1] flex items-center gap-1 bg-background/60 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-muted-foreground pointer-events-none">
                  <ZoomIn className="w-3 h-3" />
                  <span className="hidden sm:inline">Hover to zoom</span>
                </div>
              )}

              {/* Out of stock overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center z-[1]">
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-muted-foreground text-base px-5 py-2"
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-[2] rounded-full bg-background/80 backdrop-blur-sm hover:bg-background p-2 text-foreground transition-all shadow-sm"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-[2] rounded-full bg-background/80 backdrop-blur-sm hover:bg-background p-2 text-foreground transition-all shadow-sm"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {hasMultipleImages && (
              <div className="flex items-center justify-center gap-2 px-3 py-2.5 border-t border-border/50">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                      idx === activeIndex
                        ? 'border-primary shadow-sm'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.fullName} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-0.5"
                      sizes="64px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/shop/placeholder.jpg'
                      }}
                    />
                  </button>
                ))}

                {/* Dot indicators for counter */}
                <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
                  {activeIndex + 1}/{allImages.length}
                </span>
              </div>
            )}
          </div>

          {/* ── Product Details ── */}
          <div className="p-5 sm:p-6 lg:p-8 flex flex-col overflow-y-auto min-h-0">
            {/* Brand */}
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1.5">
              {product.brand}
            </p>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight mb-3">
              {product.fullName}
            </h2>

            {/* Price */}
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              RM{product.price.toFixed(0)}
            </p>

            {/* Divider */}
            <div className="h-px bg-border mb-4" />

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {product.description}
              </p>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                  {t('product.availableColors')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color)
                        const img = product.colorImages?.[color]
                        if (img) {
                          const idx = allImages.indexOf(img)
                          if (idx === -1) {
                            setActiveIndex(0)
                          } else {
                            setActiveIndex(idx)
                          }
                        }
                      }}
                      className={`px-3.5 py-1.5 text-sm rounded-full border transition-all ${
                        selectedColor === color
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
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
              <div className="mb-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                  {t('product.availableSizes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-1.5 text-sm rounded-full border transition-all ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
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
              <div className="mb-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2.5">
                  {t('product.specifications')}
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], i) => (
                    <div
                      key={key}
                      className={`flex justify-between items-center text-sm px-3.5 py-2.5 ${
                        i % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'
                      }`}
                    >
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-foreground font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons — pinned to bottom */}
            <div className="mt-auto pt-5">
              <a
                href={getWhatsAppOrderLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-base py-6 shadow-sm"
                  disabled={!product.inStock}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('product.whatsappOrder')}
                </Button>
              </a>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                {t('product.whatsappHint')}
              </p>
            </div>

            {/* ── Related Products ── */}
            {relatedProducts.length > 0 && onViewDetails && (
              <div className="border-t border-border pt-5 mt-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('product.relatedProducts')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.map((rp) => (
                    <button
                      key={rp.id}
                      onClick={() => onViewDetails(rp)}
                      className="group text-left rounded-lg border border-transparent hover:border-border hover:bg-muted/30 p-2 transition-all"
                    >
                      <div className="relative aspect-square bg-muted/40 rounded-md overflow-hidden mb-2">
                        <Image
                          src={rp.image}
                          alt={rp.name}
                          fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          sizes="120px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/images/shop/placeholder.jpg'
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {rp.brand}
                      </p>
                      <p className="text-xs font-medium text-foreground line-clamp-1">{rp.name}</p>
                      <p className="text-sm font-bold text-foreground">RM{rp.price.toFixed(0)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
