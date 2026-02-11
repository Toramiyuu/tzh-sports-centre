'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShopFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  priceRange: [number, number]
  selectedPriceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function ShopFilters({
  searchQuery,
  onSearchChange,
  priceRange,
  selectedPriceRange,
  onPriceRangeChange,
  onClearFilters,
  activeFilterCount,
}: ShopFiltersProps) {
  const t = useTranslations('shop')
  const [isOpen, setIsOpen] = useState(false)
  const [localPriceRange, setLocalPriceRange] = useState(selectedPriceRange)

  useEffect(() => {
    setLocalPriceRange(selectedPriceRange)
  }, [selectedPriceRange])

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Filter Button (mobile) */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-full"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'lg:hidden border-border text-muted-foreground hover:text-foreground rounded-full',
                activeFilterCount > 0 && 'border-primary text-foreground'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {t('filters.filters')}
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="bg-card border-border rounded-t-2xl"
          >
            <SheetHeader className="mb-4">
              <SheetTitle className="text-foreground">
                {t('filters.filters')}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-5">
              {/* Mobile Price Slider */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  {t('filters.priceRange')}
                </h3>
                <div className="px-1">
                  <Slider
                    value={localPriceRange}
                    min={priceRange[0]}
                    max={priceRange[1]}
                    step={10}
                    onValueChange={(v) => setLocalPriceRange(v as [number, number])}
                    onValueCommit={(v) => onPriceRangeChange(v as [number, number])}
                    className="mb-3"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>RM{localPriceRange[0]}</span>
                    <span>RM{localPriceRange[1]}</span>
                  </div>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClearFilters()
                    setIsOpen(false)
                  }}
                  className="w-full border-border text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('filters.clearAll')} ({activeFilterCount})
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Row 2: Desktop - Price slider | Clear */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Price Range Inline */}
        <span className="text-sm font-medium text-foreground whitespace-nowrap shrink-0">
          {t('filters.priceRange')}:
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
          RM{localPriceRange[0]}
        </span>
        <div className="w-48 shrink-0">
          <Slider
            value={localPriceRange}
            min={priceRange[0]}
            max={priceRange[1]}
            step={10}
            onValueChange={(v) => setLocalPriceRange(v as [number, number])}
            onValueCommit={(v) => onPriceRangeChange(v as [number, number])}
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          RM{localPriceRange[1]}
        </span>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <>
            <div className="h-5 w-px bg-border shrink-0 mx-2" />
            <button
              onClick={onClearFilters}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              {t('filters.clearAll')} ({activeFilterCount})
            </button>
          </>
        )}
      </div>
    </div>
  )
}
