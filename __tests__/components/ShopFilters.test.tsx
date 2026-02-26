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

  it('shows clear button when search query is present', () => {
    render(<ShopFilters {...mockProps} searchQuery="test" />)

    const clearButton = screen.getByRole('button')
    expect(clearButton).toBeInTheDocument()
  })

  it('calls onSearchChange with empty string when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShopFilters {...mockProps} searchQuery="test" />)

    const clearButton = screen.getByRole('button')
    await user.click(clearButton)

    expect(mockProps.onSearchChange).toHaveBeenCalledWith('')
  })

  it('does not show clear button when search query is empty', () => {
    render(<ShopFilters {...mockProps} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
