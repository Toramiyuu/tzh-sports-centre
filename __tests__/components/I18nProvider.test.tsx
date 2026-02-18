/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { I18nProvider, useLocale } from '@/components/I18nProvider'

function TestComponent() {
  const { locale, setLocale } = useLocale()
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <button onClick={() => setLocale('zh' as const)}>Switch to Chinese</button>
      <button onClick={() => setLocale('ms' as const)}>Switch to Malay</button>
    </div>
  )
}

describe('I18nProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    const storage = new Map<string, string>()
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    delete (window as { location?: unknown }).location
    window.location = { reload: vi.fn() } as never
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses default locale (en) when no saved locale exists', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toHaveTextContent('en')
    })
  })

  it('loads saved locale from cookie on mount', async () => {
    document.cookie = 'NEXT_LOCALE=zh;path=/;max-age=31536000'

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toHaveTextContent('zh')
    })
  })

  it('loads saved locale from localStorage if cookie is missing', async () => {
    localStorage.setItem('locale', 'ms')

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toHaveTextContent('ms')
    })
  })

  it('calls setLocale and reloads page', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toBeInTheDocument()
    })

    const button = screen.getByText('Switch to Chinese')
    await user.click(button)

    expect(window.location.reload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('locale')).toBe('zh')
  })

  it('returns default values when useLocale is called outside provider', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('current-locale')).toHaveTextContent('en')
  })

  it('ignores invalid locale from cookie and uses default', async () => {
    document.cookie = 'NEXT_LOCALE=invalid;path=/;max-age=31536000'

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toHaveTextContent('en')
    })
  })
})
