'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductRevealCard } from '@/components/ui/product-reveal-card'
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
import { Search, Filter, X, Phone, Palette, Check, PackageSearch } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
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

function StringCard({
  string,
  onSelect,
  selectLabel,
  stockInfo,
  soldOutLabel = 'Sold Out',
}: {
  string: StringProduct
  onSelect: (s: StringProduct) => void
  selectLabel: string
  perRacketLabel: string
  stockInfo?: StockInfo
  soldOutLabel?: string
  colorsAvailableLabel?: string
}) {
  const isInStock = stockInfo?.inStock ?? true
  const availableColors = stockInfo?.colors?.filter((c) => c.inStock) || []
  const colorNames = availableColors.map((c) => c.color)

  const description = [
    string.description,
    string.gauge && `Gauge: ${string.gauge}`,
    string.type && `Type: ${string.type}`,
  ].filter(Boolean).join(' · ')

  return (
    <ProductRevealCard
      name={string.name}
      price={`RM${string.price}`}
      image={string.image || `https://placehold.co/400x300/${(BRAND_COLORS[string.brand] || '#666').replace('#', '')}/${(BRAND_COLORS[string.brand] || '#666').replace('#', '')}?text=${encodeURIComponent(string.brand)}`}
      description={description}
      brand={string.brand}
      badge={
        !isInStock
          ? soldOutLabel
          : string.gauge
            ? string.gauge
            : undefined
      }
      badgeVariant={!isInStock ? 'muted' : 'primary'}
      colors={colorNames.length > 0 ? colorNames : undefined}
      ctaLabel={selectLabel}
      onCtaClick={() => isInStock && onSelect(string)}
      onAdd={() => isInStock && onSelect(string)}
      enableAnimations
      className="w-full"
    />
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

  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const [selectedString, setSelectedString] = useState<StringProduct | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

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

    if (availableColors.length === 0) {
      router.push(`/stringing/checkout?string=${stringProduct.id}`)
      return
    }

    if (availableColors.length === 1) {
      router.push(`/stringing/checkout?string=${stringProduct.id}&color=${encodeURIComponent(availableColors[0].color)}`)
      return
    }

    setSelectedString(stringProduct)
    setSelectedColor(null)
    setColorDialogOpen(true)
  }

  const handleColorConfirm = () => {
    if (!selectedString || !selectedColor) return
    router.push(`/stringing/checkout?string=${selectedString.id}&color=${encodeURIComponent(selectedColor)}`)
  }

  const availableColors = selectedString
    ? stockStatus[selectedString.id]?.colors?.filter((c) => c.inStock) || []
    : []

  const filtersContent = (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">{t('catalog.search')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('catalog.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Brand Filter */}
      <div className="space-y-3">
        <Label className="text-muted-foreground">{t('catalog.brand')}</Label>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => handleBrandToggle(brand)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor={`brand-${brand}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2 text-foreground"
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
        <Label className="text-muted-foreground">{t('catalog.priceRange')}</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={minPrice}
            max={maxPrice}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
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
          className="w-full border-border text-foreground hover:bg-secondary"
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
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
              Professional Service
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display text-foreground tracking-tight leading-[1.1] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-forwards">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
              <a href="https://wa.me/601175758508" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full h-12 px-6">
                  <Phone className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
              </a>
              <Link href="/stringing/track">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary rounded-full h-12 px-6">
                  <PackageSearch className="w-5 h-5 mr-2" />
                  Track Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 sm:top-24 bg-background rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-lg text-foreground mb-4">{t('catalog.filters')}</h2>
              {filtersContent}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full border-border text-foreground hover:bg-card">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('catalog.filters')}
                    {(selectedBrands.length > 0 || search) && (
                      <Badge variant="secondary" className="ml-2 bg-primary text-white">
                        {selectedBrands.length + (search ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-background border-border">
                  <SheetHeader>
                    <SheetTitle className="text-foreground">{t('catalog.filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {filtersContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              {t('catalog.showingResults', { count: filteredStrings.length })}
            </div>

            {/* String Grid */}
            {filteredStrings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('catalog.noResults')}</p>
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
                      ? 'border-primary bg-secondary'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-border shadow-sm"
                    style={{ backgroundColor: colorOption.color.toLowerCase() }}
                  />
                  <span className="text-sm font-medium text-foreground">{colorOption.color}</span>
                  {selectedColor === colorOption.color && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-foreground" />
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
