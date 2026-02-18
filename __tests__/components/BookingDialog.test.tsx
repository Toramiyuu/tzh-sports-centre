/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookingDialog } from '@/components/member/BookingDialog'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/lesson-config', () => ({
  LESSON_TYPES: [
    { value: 'private_badminton', billingType: 'per_session', maxStudents: 1 },
    { value: 'group_badminton', billingType: 'per_session', maxStudents: 4 },
  ],
  getLessonType: (value: string) => {
    if (value === 'private_badminton') return { value: 'private_badminton', maxStudents: 1, billingType: 'per_session' }
    if (value === 'group_badminton') return { value: 'group_badminton', maxStudents: 4, billingType: 'per_session' }
    return null
  },
  getLessonPrice: (type: string, duration: number) => {
    if (type === 'private_badminton') return duration * 50
    if (type === 'group_badminton') return duration * 40
    return 0
  },
  getDefaultDuration: () => 1.5,
  getDurationOptions: () => [
    { value: 1, label: '1 hour', price: 50, pricePerPerson: null },
    { value: 1.5, label: '1.5 hours', price: 75, pricePerPerson: null },
  ],
  getPricePerPerson: () => null,
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
