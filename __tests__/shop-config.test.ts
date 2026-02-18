import { describe, it, expect } from 'vitest'
import {
  getWhatsAppOrderLink,
  getCategoryName,
  getCategory,
  filterByCategory,
  searchProducts,
  filterByBrands,
  filterByPriceRange,
  getAllBrands,
  getFeaturedProducts,
  getPriceRange,
  type ShopProduct,
  SHOP_WHATSAPP_NUMBER,
} from '@/lib/shop-config'

const testProducts: ShopProduct[] = [
  {
    id: 'racket-1',
    category: 'rackets',
    brand: 'Yonex',
    name: 'Astrox 99',
    fullName: 'Yonex Astrox 99',
    price: 450,
    description: 'Professional racket',
    image: '/racket1.jpg',
    inStock: true,
    featured: true,
  },
  {
    id: 'racket-2',
    category: 'rackets',
    brand: 'Victor',
    name: 'Thruster K9900',
    fullName: 'Victor Thruster K9900',
    price: 380,
    description: 'Fast racket for doubles',
    image: '/racket2.jpg',
    inStock: true,
    featured: false,
  },
  {
    id: 'shoe-1',
    category: 'shoes',
    brand: 'Yonex',
    name: 'Power Cushion 65',
    fullName: 'Yonex Power Cushion 65 Z3',
    price: 520,
    description: 'Badminton court shoes',
    image: '/shoe1.jpg',
    inStock: false,
    featured: false,
  },
  {
    id: 'bag-1',
    category: 'bags',
    brand: 'Li-Ning',
    name: 'Tournament Bag',
    fullName: 'Li-Ning Tournament Bag ABDN123',
    price: 180,
    image: '/bag1.jpg',
    inStock: true,
    featured: true,
  },
]

describe('getWhatsAppOrderLink', () => {
  it('generates WhatsApp link with encoded product details', () => {
    const product = testProducts[0]
    const link = getWhatsAppOrderLink(product)
    expect(link).toContain(`https://wa.me/${SHOP_WHATSAPP_NUMBER}`)
    expect(link).toContain(encodeURIComponent(product.fullName))
    expect(link).toContain(encodeURIComponent(`RM${product.price}`))
    expect(link).toContain(encodeURIComponent('Rackets'))
  })

  it('handles products with different categories', () => {
    const shoeProduct = testProducts[2]
    const link = getWhatsAppOrderLink(shoeProduct)
    expect(link).toContain(encodeURIComponent('Shoes'))
  })
})

describe('getCategoryName', () => {
  it('returns category name for valid category ID', () => {
    expect(getCategoryName('rackets')).toBe('Rackets')
    expect(getCategoryName('shoes')).toBe('Shoes')
    expect(getCategoryName('bags')).toBe('Bags')
  })

  it('returns category ID for unknown category', () => {
    expect(getCategoryName('unknown' as never)).toBe('unknown')
  })
})

describe('getCategory', () => {
  it('returns category object for valid ID', () => {
    const category = getCategory('rackets')
    expect(category).toBeDefined()
    expect(category?.id).toBe('rackets')
    expect(category?.name).toBe('Rackets')
  })

  it('returns undefined for unknown category', () => {
    const category = getCategory('unknown' as never)
    expect(category).toBeUndefined()
  })
})

describe('filterByCategory', () => {
  it('returns all products when category is "all"', () => {
    const result = filterByCategory(testProducts, 'all')
    expect(result).toHaveLength(4)
  })

  it('filters products by category', () => {
    const rackets = filterByCategory(testProducts, 'rackets')
    expect(rackets).toHaveLength(2)
    expect(rackets.every(p => p.category === 'rackets')).toBe(true)
  })

  it('returns empty array for category with no products', () => {
    const clothing = filterByCategory(testProducts, 'clothing')
    expect(clothing).toHaveLength(0)
  })
})

describe('searchProducts', () => {
  it('returns all products when query is empty', () => {
    expect(searchProducts(testProducts, '')).toHaveLength(4)
    expect(searchProducts(testProducts, '   ')).toHaveLength(4)
  })

  it('searches by product name', () => {
    const result = searchProducts(testProducts, 'Astrox')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('racket-1')
  })

  it('searches by brand', () => {
    const result = searchProducts(testProducts, 'Yonex')
    expect(result).toHaveLength(2)
  })

  it('searches by description', () => {
    const result = searchProducts(testProducts, 'doubles')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('racket-2')
  })

  it('is case-insensitive', () => {
    expect(searchProducts(testProducts, 'yonex')).toHaveLength(2)
    expect(searchProducts(testProducts, 'YONEX')).toHaveLength(2)
  })

  it('trims whitespace', () => {
    expect(searchProducts(testProducts, '  Yonex  ')).toHaveLength(2)
  })
})

describe('filterByBrands', () => {
  it('returns all products when brands array is empty', () => {
    const result = filterByBrands(testProducts, [])
    expect(result).toHaveLength(4)
  })

  it('filters by single brand', () => {
    const result = filterByBrands(testProducts, ['Yonex'])
    expect(result).toHaveLength(2)
  })

  it('filters by multiple brands', () => {
    const result = filterByBrands(testProducts, ['Yonex', 'Victor'])
    expect(result).toHaveLength(3)
  })

  it('returns empty array when no products match', () => {
    const result = filterByBrands(testProducts, ['Adidas'])
    expect(result).toHaveLength(0)
  })
})

describe('filterByPriceRange', () => {
  it('filters products within price range', () => {
    const result = filterByPriceRange(testProducts, 100, 400)
    expect(result).toHaveLength(2)
  })

  it('includes products at exact min and max boundaries', () => {
    const result = filterByPriceRange(testProducts, 180, 450)
    expect(result).toHaveLength(3)
  })

  it('returns empty array when no products in range', () => {
    const result = filterByPriceRange(testProducts, 1, 50)
    expect(result).toHaveLength(0)
  })

  it('returns all products with very wide range', () => {
    const result = filterByPriceRange(testProducts, 0, 10000)
    expect(result).toHaveLength(4)
  })
})

describe('getAllBrands', () => {
  it('returns unique brand names', () => {
    const brands = getAllBrands(testProducts)
    expect(brands).toHaveLength(3)
    expect(brands).toContain('Yonex')
    expect(brands).toContain('Victor')
    expect(brands).toContain('Li-Ning')
  })

  it('returns sorted brand names', () => {
    const brands = getAllBrands(testProducts)
    expect(brands).toEqual(['Li-Ning', 'Victor', 'Yonex'])
  })

  it('handles empty product array', () => {
    const brands = getAllBrands([])
    expect(brands).toEqual([])
  })
})

describe('getFeaturedProducts', () => {
  it('returns only featured AND in-stock products', () => {
    const result = getFeaturedProducts(testProducts)
    expect(result).toHaveLength(2)
    expect(result.every(p => p.featured && p.inStock)).toBe(true)
  })

  it('excludes out-of-stock products even if featured', () => {
    const productsWithFeaturedOutOfStock: ShopProduct[] = [
      ...testProducts,
      {
        id: 'test',
        category: 'shoes',
        brand: 'Test',
        name: 'Test',
        fullName: 'Test Product',
        price: 100,
        image: '/test.jpg',
        inStock: false,
        featured: true,
      },
    ]
    const result = getFeaturedProducts(productsWithFeaturedOutOfStock)
    expect(result).toHaveLength(2)
  })

  it('returns empty array when no featured products', () => {
    const noFeatured = testProducts.map(p => ({ ...p, featured: false }))
    const result = getFeaturedProducts(noFeatured)
    expect(result).toEqual([])
  })
})

describe('getPriceRange', () => {
  it('returns min and max prices from products', () => {
    const range = getPriceRange(testProducts)
    expect(range.min).toBe(180)
    expect(range.max).toBe(520)
  })

  it('returns default range for empty array', () => {
    const range = getPriceRange([])
    expect(range).toEqual({ min: 0, max: 1000 })
  })

  it('handles single product', () => {
    const range = getPriceRange([testProducts[0]])
    expect(range.min).toBe(450)
    expect(range.max).toBe(450)
  })
})
