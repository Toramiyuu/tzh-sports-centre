/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ShopProductDialog } from '@/components/shop/ShopProductDialog'
import type { ShopProduct } from '@/lib/shop-config'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

describe('ShopProductDialog', () => {
  const mockProduct: ShopProduct = {
    id: '1',
    productId: 'PROD-001',
    name: 'Test Racket',
    brand: 'TestBrand',
    price: 299,
    image: '/test.jpg',
    images: ['/test.jpg', '/test2.jpg'],
    category: 'rackets',
    description: 'A test racket',
    inStock: true,
    featured: false,
    colors: ['Red', 'Blue'],
    sizes: ['S', 'M', 'L'],
    colorImages: {
      Red: '/red.jpg',
      Blue: '/blue.jpg',
    },
  }

  const mockProps = {
    product: mockProduct,
    open: true,
    onOpenChange: vi.fn(),
    allProducts: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog when open with product', () => {
    render(<ShopProductDialog {...mockProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })

  it('does not render when product is null', () => {
    render(<ShopProductDialog {...mockProps} product={null} />)

    expect(screen.queryByText('Test Racket')).not.toBeInTheDocument()
  })

  it('displays available colors', () => {
    render(<ShopProductDialog {...mockProps} />)

    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
  })

  it('displays available sizes', () => {
    render(<ShopProductDialog {...mockProps} />)

    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('shows out of stock badge when inStock is false', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false }
    render(<ShopProductDialog {...mockProps} product={outOfStockProduct} />)

    const badge = screen.getByText(/product.outOfStock/i)
    expect(badge).toBeInTheDocument()
  })

  it('renders multiple interactive elements', () => {
    render(<ShopProductDialog {...mockProps} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
