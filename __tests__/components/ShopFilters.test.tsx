/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ShopFilters } from '@/components/shop/ShopFilters'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('ShopFilters', () => {
  const mockProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    priceRange: [0, 1000] as [number, number],
    selectedPriceRange: [0, 1000] as [number, number],
    onPriceRangeChange: vi.fn(),
    onClearFilters: vi.fn(),
    activeFilterCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input with placeholder', () => {
    render(<ShopFilters {...mockProps} />)

    const searchInput = screen.getByPlaceholderText('filters.searchPlaceholder')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveValue('')
  })

  it('displays search query value', () => {
    render(<ShopFilters {...mockProps} searchQuery="badminton" />)

    const searchInput = screen.getByDisplayValue('badminton')
    expect(searchInput).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup()
    render(<ShopFilters {...mockProps} />)

    const searchInput = screen.getByPlaceholderText('filters.searchPlaceholder')
    await user.type(searchInput, 'racket')

    expect(mockProps.onSearchChange).toHaveBeenCalled()
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('r')
  })

  it('displays active filter count badge', () => {
    render(<ShopFilters {...mockProps} activeFilterCount={3} />)

    const filterButton = screen.getByText('filters.filters')
    expect(filterButton).toBeInTheDocument()

    const badge = screen.getByText('3')
    expect(badge).toBeInTheDocument()
  })

  it('shows clear all button when filters are active', () => {
    render(<ShopFilters {...mockProps} activeFilterCount={2} />)

    const clearButtons = screen.getAllByText(/filters.clearAll/i)
    expect(clearButtons.length).toBeGreaterThan(0)
  })

  it('calls onClearFilters when clear all button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShopFilters {...mockProps} activeFilterCount={2} />)

    const clearAllButtons = screen.getAllByRole('button')
    const clearButton = clearAllButtons.find((btn) =>
      btn.textContent?.includes('filters.clearAll')
    )

    await user.click(clearButton!)

    expect(mockProps.onClearFilters).toHaveBeenCalledTimes(1)
  })

  it('displays price range values', () => {
    render(<ShopFilters {...mockProps} selectedPriceRange={[100, 500]} />)

    const priceTexts = screen.getAllByText(/RM100|RM500/)
    expect(priceTexts.length).toBeGreaterThan(0)
  })
})
