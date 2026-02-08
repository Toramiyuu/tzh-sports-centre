'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  brands: string[]
  selectedBrands: string[]
  onBrandChange: (brands: string[]) => void
  priceRange: [number, number]
  selectedPriceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function ShopFilters({
  searchQuery,
  onSearchChange,
  brands,
  selectedBrands,
  onBrandChange,
  priceRange,
  selectedPriceRange,
  onPriceRangeChange,
  onClearFilters,
  activeFilterCount,
}: ShopFiltersProps) {
  const t = useTranslations('shop')
  const [isOpen, setIsOpen] = useState(false)

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand))
    } else {
      onBrandChange([...selectedBrands, brand])
    }
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brand Filter */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          {t('filters.brand')}
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => handleBrandToggle(brand)}
                className="border-border data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          {t('filters.priceRange')}
        </h3>
        <div className="px-2">
          <Slider
            value={selectedPriceRange}
            min={priceRange[0]}
            max={priceRange[1]}
            step={10}
            onValueChange={(value) =>
              onPriceRangeChange(value as [number, number])
            }
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>RM{selectedPriceRange[0]}</span>
            <span>RM{selectedPriceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
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
  )

  return (
    <div className="flex gap-3 items-center">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
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

      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Brand dropdown could go here for desktop */}
        <FilterContent />
      </div>

      {/* Mobile Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'lg:hidden border-border text-muted-foreground hover:text-foreground rounded-full',
              activeFilterCount > 0 && 'border-teal-500 text-teal-500'
            )}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {t('filters.filters')}
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-card border-border rounded-t-2xl h-[70vh]"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-foreground">
              {t('filters.filters')}
            </SheetTitle>
          </SheetHeader>
          <FilterContent />
        </SheetContent>
      </Sheet>
    </div>
  )
}
