'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ShopHero } from '@/components/shop/ShopHero'
import { ShopCategoryTabs } from '@/components/shop/ShopCategoryTabs'
import { ShopProductCard } from '@/components/shop/ShopProductCard'
import { ShopProductDialog } from '@/components/shop/ShopProductDialog'
import { ShopFilters } from '@/components/shop/ShopFilters'
import {
  ShopProduct,
  ShopCategoryId,
  SHOP_PRODUCTS,
  SHOP_CATEGORIES,
  filterByCategory,
  searchProducts,
  filterByBrands,
  filterByPriceRange,
  getAllBrands,
  getPriceRange,
  getFeaturedProducts,
} from '@/lib/shop-config'

const validCategories = SHOP_CATEGORIES.map((c) => c.id)

function ShopContent() {
  const t = useTranslations('shop')
  const searchParams = useSearchParams()

  // Get initial category from URL
  const categoryParam = searchParams.get('category')
  const initialCategory: ShopCategoryId | 'all' =
    categoryParam && validCategories.includes(categoryParam as ShopCategoryId)
      ? (categoryParam as ShopCategoryId)
      : 'all'

  // State
  const [selectedCategory, setSelectedCategory] = useState<
    ShopCategoryId | 'all'
  >(initialCategory)

  // Update category when URL changes
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam as ShopCategoryId)) {
      setSelectedCategory(categoryParam as ShopCategoryId)
    } else if (!categoryParam) {
      setSelectedCategory('all')
    }
  }, [categoryParam])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  // Get price range for all products
  const priceRangeObj = useMemo(() => getPriceRange(SHOP_PRODUCTS), [])
  const priceRange: [number, number] = [priceRangeObj.min, priceRangeObj.max]
  const [selectedPriceRange, setSelectedPriceRange] =
    useState<[number, number]>(priceRange)

  // Get all brands
  const allBrands = useMemo(() => getAllBrands(SHOP_PRODUCTS), [])

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = SHOP_PRODUCTS

    // Category filter
    if (selectedCategory === 'all') {
      // Show featured products first, then others
      products = getFeaturedProducts(products)
    } else {
      products = filterByCategory(products, selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      products = searchProducts(products, searchQuery)
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      products = filterByBrands(products, selectedBrands)
    }

    // Price range filter
    if (
      selectedPriceRange[0] !== priceRange[0] ||
      selectedPriceRange[1] !== priceRange[1]
    ) {
      products = filterByPriceRange(
        products,
        selectedPriceRange[0],
        selectedPriceRange[1]
      )
    }

    return products
  }, [
    selectedCategory,
    searchQuery,
    selectedBrands,
    selectedPriceRange,
    priceRange,
  ])

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedBrands.length > 0) count += selectedBrands.length
    if (
      selectedPriceRange[0] !== priceRange[0] ||
      selectedPriceRange[1] !== priceRange[1]
    )
      count += 1
    return count
  }, [selectedBrands, selectedPriceRange, priceRange])

  const handleViewDetails = (product: ShopProduct) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  const handleClearFilters = () => {
    setSelectedBrands([])
    setSelectedPriceRange(priceRange)
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <ShopHero />

      {/* Category Tabs */}
      <ShopCategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <ShopFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            brands={allBrands}
            selectedBrands={selectedBrands}
            onBrandChange={setSelectedBrands}
            priceRange={priceRange}
            selectedPriceRange={selectedPriceRange}
            onPriceRangeChange={setSelectedPriceRange}
            onClearFilters={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? t('results.product')
              : t('results.products')}
            {selectedCategory !== 'all' && (
              <span>
                {' '}
                {t('results.in')} {t(`categories.${selectedCategory}`)}
              </span>
            )}
          </p>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ShopProductCard
                  product={product}
                  onViewDetails={handleViewDetails}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {t('results.noProducts')}
            </p>
            <button
              onClick={handleClearFilters}
              className="text-teal-400 hover:text-teal-300 underline"
            >
              {t('filters.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <ShopProductDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <ShopHero />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
