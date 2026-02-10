'use client'

import { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react'
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
  SHOP_CATEGORIES,
  filterByBrands,
  filterByPriceRange,
  getAllBrands,
  getPriceRange,
  searchProducts,
} from '@/lib/shop-config'

const StringingPage = lazy(() => import('@/app/stringing/page'))

const validCategories = SHOP_CATEGORIES.map((c) => c.id)

// Map database product to ShopProduct interface
function mapDbProduct(dbProduct: Record<string, unknown>): ShopProduct {
  return {
    id: dbProduct.productId as string,
    category: dbProduct.category as ShopCategoryId,
    subcategory: dbProduct.subcategory as string | undefined,
    brand: dbProduct.brand as string,
    name: dbProduct.name as string,
    fullName: dbProduct.fullName as string,
    price: dbProduct.price as number,
    description: dbProduct.description as string | undefined,
    specs: (dbProduct.specs as Record<string, string>) || undefined,
    image: dbProduct.image as string,
    images: (dbProduct.images as string[]) || undefined,
    colors: (dbProduct.colors as string[]) || undefined,
    sizes: (dbProduct.sizes as string[]) || undefined,
    inStock: dbProduct.inStock as boolean,
    featured: dbProduct.featured as boolean | undefined,
  }
}

function ShopContent() {
  const t = useTranslations('shop')
  const searchParams = useSearchParams()

  // Get initial category from URL
  const categoryParam = searchParams.get('category')
  const initialCategory: ShopCategoryId | 'all' | 'stringing' =
    categoryParam === 'stringing'
      ? 'stringing'
      : categoryParam && validCategories.includes(categoryParam as ShopCategoryId)
        ? (categoryParam as ShopCategoryId)
        : 'all'

  // State
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<
    ShopCategoryId | 'all' | 'stringing'
  >(initialCategory)

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/shop/products')
      if (res.ok) {
        const data = await res.json()
        setAllProducts(data.map(mapDbProduct))
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Update category when URL changes
  useEffect(() => {
    if (categoryParam === 'stringing') {
      setSelectedCategory('stringing')
    } else if (categoryParam && validCategories.includes(categoryParam as ShopCategoryId)) {
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
  const priceRangeObj = useMemo(() => getPriceRange(allProducts), [allProducts])
  const priceRange: [number, number] = [priceRangeObj.min, priceRangeObj.max]
  const [selectedPriceRange, setSelectedPriceRange] =
    useState<[number, number]>(priceRange)

  // Reset price range when products load
  useEffect(() => {
    if (allProducts.length > 0) {
      const range = getPriceRange(allProducts)
      setSelectedPriceRange([range.min, range.max])
    }
  }, [allProducts])

  // Get all brands
  const allBrands = useMemo(() => getAllBrands(allProducts), [allProducts])

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = allProducts

    // Category filter
    if (selectedCategory === 'all') {
      // Show all in-stock products, featured first
      products = products.filter(p => p.inStock)
      products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    } else {
      products = products.filter(p => p.category === selectedCategory)
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
    allProducts,
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
      {selectedCategory === 'stringing' ? (
        /* Stringing Service Section */
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        }>
          <StringingPage />
        </Suspense>
      ) : (
        <>
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
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-secondary rounded-lg mb-3" />
                    <div className="h-3 bg-secondary rounded w-1/3 mb-2" />
                    <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
                    <div className="h-5 bg-secondary rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
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
                  className="text-[#0a2540] hover:text-[#0a2540] underline"
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
        </>
      )}
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
