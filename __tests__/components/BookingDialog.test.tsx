/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookingDialog } from '@/components/member/BookingDialog'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/hooks/useLessonTypes', () => ({
  useLessonTypes: () => ({
    lessonTypes: [
      { slug: 'private_badminton', name: 'Private Badminton', billingType: 'per_session', maxStudents: 1, price: 75, pricingTiers: [{ duration: 1, price: 50 }, { duration: 1.5, price: 75 }] },
      { slug: 'group_badminton', name: 'Group Badminton', billingType: 'per_session', maxStudents: 4, price: 60, pricingTiers: [{ duration: 1, price: 40 }, { duration: 1.5, price: 60 }] },
    ],
    loading: false,
    error: null,
    getLessonTypeBySlug: (slug: string) => {
      if (slug === 'private_badminton') return { slug: 'private_badminton', name: 'Private Badminton', maxStudents: 1, billingType: 'per_session', price: 75, pricingTiers: [{ duration: 1, price: 50 }, { duration: 1.5, price: 75 }] }
      if (slug === 'group_badminton') return { slug: 'group_badminton', name: 'Group Badminton', maxStudents: 4, billingType: 'per_session', price: 60, pricingTiers: [{ duration: 1, price: 40 }, { duration: 1.5, price: 60 }] }
      return undefined
    },
    getLessonPrice: (_slug: string, duration?: number) => (duration || 1.5) * 50,
    getDefaultDuration: () => 1.5,
    getDurationOptions: () => [
      { value: 1, label: '1 hour', price: 50, pricePerPerson: null },
      { value: 1.5, label: '1.5 hours', price: 75, pricePerPerson: null },
    ],
    getPricePerPerson: () => null,
    isMonthlyBilling: () => false,
  }),
}))

vi.mock('@/lib/timetable-utils', () => ({
  formatDateString: (date: Date) => date.toISOString().split('T')[0],
}))

describe('BookingDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSubmit = vi.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    selectedDate: new Date('2026-03-15'),
    selectedTime: '14:00',
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(true)
  })

  it('renders dialog when open with date and time', () => {
    render(<BookingDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    expect(screen.getByText(/March 15, 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/2:00 PM/i)).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(<BookingDialog {...defaultProps} open={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders lesson type selector', () => {
    render(<BookingDialog {...defaultProps} />)

    const selectors = screen.getAllByRole('combobox')
    expect(selectors.length).toBeGreaterThan(0)
  })

  it('renders action buttons', () => {
    render(<BookingDialog {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders with null date and time gracefully', () => {
    render(<BookingDialog {...defaultProps} selectedDate={null} selectedTime={null} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })
})
