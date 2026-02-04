'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Search, Filter, X, Wrench, Phone, Palette, Check, PackageSearch } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  STRING_INVENTORY,
  BRAND_COLORS,
  getUniqueBrands,
  filterStrings,
  getPriceRange,
  StringProduct,
} from '@/lib/stringing-config'

interface ColorStock {
  color: string
  inStock: boolean
}

interface StockInfo {
  inStock: boolean
  colors: ColorStock[]
}

// String Card Component with hover flip animation
function StringCard({
  string,
  onSelect,
  selectLabel,
  perRacketLabel,
  stockInfo,
  soldOutLabel = 'Sold Out',
  colorsAvailableLabel = 'colors available',
}: {
  string: StringProduct
  onSelect: (s: StringProduct) => void
  selectLabel: string
  perRacketLabel: string
  stockInfo?: StockInfo
  soldOutLabel?: string
  colorsAvailableLabel?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isInStock = stockInfo?.inStock ?? true
  const availableColors = stockInfo?.colors?.filter((c) => c.inStock) || []

  return (
    <Card
      className={`transition-shadow overflow-visible ${
        isInStock
          ? 'hover:shadow-lg cursor-pointer'
          : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={() => isInStock && onSelect(string)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* Image Container - shows front or back based on hover */}
        <div className="h-40 relative bg-neutral-50 rounded-t-lg overflow-hidden">
          {!isHovered ? (
            // Front - Product Image
            string.image ? (
              <img
                src={string.image}
                alt={string.fullName}
                className="h-full w-full object-contain p-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.style.backgroundColor = BRAND_COLORS[string.brand] || '#666'
                  target.parentElement!.innerHTML = `<span class="text-white text-2xl font-bold opacity-50">${string.brand}</span>`
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: BRAND_COLORS[string.brand] || '#666' }}
              >
                <span className="text-white text-2xl font-bold opacity-50">
                  {string.brand}
                </span>
              </div>
            )
          ) : (
            // Back - Stats/Specifications
            <div className="h-full w-full bg-neutral-100 flex items-center justify-center">
              {string.backImage ? (
                <img
                  src={string.backImage}
                  alt={`${string.fullName} specifications`}
                  className="h-full w-full object-contain p-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="text-center p-4">
                        <p class="text-sm font-semibold text-neutral-700">${string.fullName}</p>
                        <p class="text-xs text-neutral-500 mt-1">${string.gauge || ''}</p>
                        <p class="text-xs text-neutral-500">${string.type || ''}</p>
                      </div>
                    `
                  }}
                />
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm font-semibold text-neutral-700">{string.fullName}</p>
                  <p className="text-xs text-neutral-500 mt-1">{string.gauge}</p>
                  <p className="text-xs text-neutral-500 capitalize">{string.type}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">
                {string.brand}
              </p>
              <h3 className="font-semibold text-lg">{string.name}</h3>
            </div>
            {string.gauge && (
              <Badge variant="outline" className="text-xs">
                {string.gauge}
              </Badge>
            )}
          </div>

          {string.description && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {string.description}
            </p>
          )}

          {/* Available colors preview */}
          {isInStock && availableColors.length > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex -space-x-1">
                {availableColors.slice(0, 5).map((c) => (
                  <div
                    key={c.color}
                    className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: c.color.toLowerCase() }}
                    title={c.color}
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-500 ml-1">
                {availableColors.length} {colorsAvailableLabel}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className={`text-2xl font-bold ${isInStock ? 'text-neutral-900' : 'text-neutral-400'}`}>
                RM{string.price}
              </span>
              <span className="text-sm text-neutral-500 ml-1">
                {perRacketLabel}
              </span>
            </div>
            {isInStock ? (
              <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 rounded-full">
                {selectLabel}
              </Button>
            ) : (
              <Badge className="bg-neutral-100 text-neutral-500 px-3 py-1">
                {soldOutLabel}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StringingPage() {
  const t = useTranslations('stringing')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [stockStatus, setStockStatus] = useState<Record<string, StockInfo>>({})

  // Color selection dialog state
  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const [selectedString, setSelectedString] = useState<StringProduct | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // Fetch stock status on mount
  useEffect(() => {
    const fetchStockStatus = async () => {
      try {
        const res = await fetch('/api/stringing/stock')
        const data = await res.json()
        if (data.stockStatus) {
          setStockStatus(data.stockStatus)
        }
      } catch (error) {
        console.error('Error fetching stock status:', error)
      }
    }
    fetchStockStatus()
  }, [])

  const brands = getUniqueBrands()
  const { min: minPrice, max: maxPrice } = getPriceRange()

  // Initialize price range on mount
  useState(() => {
    setPriceRange([minPrice, maxPrice])
  })

  const filteredStrings = useMemo(() => {
    return filterStrings({
      search,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    })
  }, [search, selectedBrands, priceRange])

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedBrands([])
    setPriceRange([minPrice, maxPrice])
  }

  const handleSelectString = (stringProduct: StringProduct) => {
    const stock = stockStatus[stringProduct.id]
    const availableColors = stock?.colors?.filter((c) => c.inStock) || []

    // If no colors are set up, go directly to checkout
    if (availableColors.length === 0) {
      router.push(`/stringing/checkout?string=${stringProduct.id}`)
      return
    }

    // If only one color available, auto-select it
    if (availableColors.length === 1) {
      router.push(`/stringing/checkout?string=${stringProduct.id}&color=${encodeURIComponent(availableColors[0].color)}`)
      return
    }

    // Multiple colors - show selection dialog
    setSelectedString(stringProduct)
    setSelectedColor(null)
    setColorDialogOpen(true)
  }

  const handleColorConfirm = () => {
    if (!selectedString || !selectedColor) return
    router.push(`/stringing/checkout?string=${selectedString.id}&color=${encodeURIComponent(selectedColor)}`)
  }

  // Get available colors for selected string
  const availableColors = selectedString
    ? stockStatus[selectedString.id]?.colors?.filter((c) => c.inStock) || []
    : []

  // Filters JSX - defined as variable to avoid component recreation issues
  const filtersContent = (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label>{t('catalog.search')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder={t('catalog.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Brand Filter */}
      <div className="space-y-3">
        <Label>{t('catalog.brand')}</Label>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => handleBrandToggle(brand)}
              />
              <label
                htmlFor={`brand-${brand}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS[brand] || '#666' }}
                />
                {brand}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label>{t('catalog.priceRange')}</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={minPrice}
            max={maxPrice}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-neutral-600">
            <span>RM{priceRange[0]}</span>
            <span>RM{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(search || selectedBrands.length > 0 || priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          {t('catalog.clearFilters')}
        </Button>
      )}
    </div>
  )

  return (
    <div>
      {/* Hero Section */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
              Professional Service
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 tracking-tight leading-[1.1] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-forwards">
              {t('title')}
            </h1>
            <p className="text-lg text-neutral-500 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
              <a href="https://wa.me/601175758508" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full h-12 px-6">
                  <Phone className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
              </a>
              <Link href="/stringing/track">
                <Button size="lg" variant="outline" className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-full h-12 px-6">
                  <PackageSearch className="w-5 h-5 mr-2" />
                  Track Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-lg text-neutral-900 mb-4">{t('catalog.filters')}</h2>
              {filtersContent}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('catalog.filters')}
                    {(selectedBrands.length > 0 || search) && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedBrands.length + (search ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>{t('catalog.filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {filtersContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-neutral-600">
              {t('catalog.showingResults', { count: filteredStrings.length })}
            </div>

            {/* String Grid */}
            {filteredStrings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500">{t('catalog.noResults')}</p>
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  {t('catalog.clearFilters')}
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500 fill-mode-forwards">
                {filteredStrings.map((string, index) => (
                  <div
                    key={string.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                  >
                  <StringCard
                    string={string}
                    onSelect={handleSelectString}
                    selectLabel={t('selectString')}
                    perRacketLabel={t('catalog.perRacket')}
                    stockInfo={stockStatus[string.id]}
                    soldOutLabel={t('catalog.soldOut')}
                    colorsAvailableLabel={t('catalog.colorsAvailable')}
                  />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
        </div>
      </div>

      {/* Color Selection Dialog */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t('catalog.selectColor')}
            </DialogTitle>
            <DialogDescription>
              {selectedString?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-3 gap-3">
              {availableColors.map((colorOption) => (
                <button
                  key={colorOption.color}
                  onClick={() => setSelectedColor(colorOption.color)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedColor === colorOption.color
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-neutral-200 shadow-sm"
                    style={{ backgroundColor: colorOption.color.toLowerCase() }}
                  />
                  <span className="text-sm font-medium text-neutral-700">{colorOption.color}</span>
                  {selectedColor === colorOption.color && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-neutral-900" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setColorDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleColorConfirm} disabled={!selectedColor}>
              {tCommon('continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
