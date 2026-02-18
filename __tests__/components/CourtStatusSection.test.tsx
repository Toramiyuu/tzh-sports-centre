/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CourtStatusSection } from '@/components/home/CourtStatusSection'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('CourtStatusSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows nothing while loading', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    )

    const { container } = render(<CourtStatusSection />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows nothing on API error', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'))

    const { container } = render(<CourtStatusSection />)

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('shows nothing when no courts available', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ availability: [] }),
    })

    const { container } = render(<CourtStatusSection />)

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('makes API call with correct date parameter', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ availability: [] }),
    })

    render(<CourtStatusSection />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArgs).toContain('/api/availability?date=')
    })
  })

  it('refreshes data every 5 minutes', async () => {
    vi.useFakeTimers()

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ availability: [] }),
    })

    render(<CourtStatusSection />)

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    vi.advanceTimersByTime(5 * 60 * 1000)

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    vi.useRealTimers()
  })

  it('cleans up interval on unmount', async () => {
    vi.useFakeTimers()

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ availability: [] }),
    })

    const { unmount } = render(<CourtStatusSection />)

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    unmount()

    vi.advanceTimersByTime(10 * 60 * 1000)

    expect(global.fetch).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
