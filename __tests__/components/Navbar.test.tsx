/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Navbar } from '@/components/Navbar'

const { mockUseSession, mockIsAdmin } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockIsAdmin: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: mockIsAdmin,
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/components/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}))

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">LanguageSwitcher</div>,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin.mockReturnValue(false)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  })

  it('renders navigation links for unauthenticated users', () => {
    render(<Navbar />)

    expect(screen.getByText(/booking/i)).toBeInTheDocument()
    expect(screen.getByText(/lessons/i)).toBeInTheDocument()
    expect(screen.getByText(/shop/i)).toBeInTheDocument()

    expect(screen.getByText('login')).toBeInTheDocument()
    expect(screen.getByText('signup')).toBeInTheDocument()

    expect(screen.queryByText(/trainingSchedule/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/updates/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument()
  })

  it('renders authenticated user links with role-gated navigation', () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com', isTrainee: true, isMember: true } },
      status: 'authenticated',
    })

    render(<Navbar />)

    expect(screen.getByText(/booking/i)).toBeInTheDocument()
    expect(screen.getByText(/lessons/i)).toBeInTheDocument()
    expect(screen.getByText(/shop/i)).toBeInTheDocument()

    expect(screen.getByText(/trainingSchedule/i)).toBeInTheDocument()
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument()
    expect(screen.getByText(/updates/i)).toBeInTheDocument()

    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument()

    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    expect(screen.queryByText('login')).not.toBeInTheDocument()
  })

  it('renders admin link for admin users', () => {
    mockIsAdmin.mockReturnValue(true)
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Admin', email: 'admin@example.com', isAdmin: true } },
      status: 'authenticated',
    })

    render(<Navbar />)

    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('shows loading state while session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<Navbar />)

    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('toggles mobile menu when menu button is clicked', async () => {
    const user = userEvent.setup()

    render(<Navbar />)

    expect(screen.getAllByText(/booking/i).length).toBe(1)

    const buttons = screen.getAllByRole('button')
    const menuButton = buttons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-menu') ||
      btn.querySelector('svg')?.classList.contains('lucide-x')
    )
    expect(menuButton).toBeDefined()
    await user.click(menuButton!)

    expect(screen.getAllByText(/booking/i).length).toBe(2)
  })
})
