/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemberDashboard } from '@/components/member/MemberDashboard'

const { mockUseSession, mockUseRouter } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockUseRouter: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/components/member/WeeklyTimetable', () => ({
  WeeklyTimetable: () => <div data-testid="weekly-timetable">Weekly Timetable</div>,
}))

vi.mock('@/components/member/StatsCards', () => ({
  StatsCards: () => <div data-testid="stats-cards">Stats Cards</div>,
}))

vi.mock('@/components/member/CoachSuggestedSection', () => ({
  CoachSuggestedSection: () => <div data-testid="coach-suggested">Coach Suggested</div>,
}))

vi.mock('@/components/member/PendingRequestsSection', () => ({
  PendingRequestsSection: () => <div data-testid="pending-requests">Pending Requests</div>,
}))

vi.mock('@/components/member/UpcomingLessonsSection', () => ({
  UpcomingLessonsSection: () => <div data-testid="upcoming-lessons">Upcoming Lessons</div>,
}))

vi.mock('@/components/member/RequestHistorySection', () => ({
  RequestHistorySection: () => <div data-testid="request-history">Request History</div>,
}))

vi.mock('@/components/member/BookingDialog', () => ({
  BookingDialog: () => <div data-testid="booking-dialog">Booking Dialog</div>,
}))

describe('MemberDashboard', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    mockUseRouter.mockReturnValue({ push: mockPush })
  })

  it('shows loading state while checking session', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })

    render(<MemberDashboard />)

    const loader = document.querySelector('.animate-spin')
    expect(loader).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<MemberDashboard />)

    expect(mockPush).toHaveBeenCalledWith('/auth/login?callbackUrl=/training')
  })

  it('shows non-member benefits screen when user is not a member', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 403,
      json: async () => ({}),
    })

    render(<MemberDashboard />)

    await screen.findByText('membersOnly.title')

    expect(screen.getByText('membersOnly.title')).toBeInTheDocument()
    expect(screen.getByText('membersOnly.enquire')).toBeInTheDocument()
  })

  it('renders member dashboard sections when user is a member', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    })

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ lessons: [], requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ requests: [] }),
      })

    render(<MemberDashboard />)

    await screen.findByTestId('stats-cards')

    expect(screen.getByTestId('stats-cards')).toBeInTheDocument()
    expect(screen.getByTestId('weekly-timetable')).toBeInTheDocument()
    expect(screen.getByTestId('pending-requests')).toBeInTheDocument()
    expect(screen.getByTestId('upcoming-lessons')).toBeInTheDocument()
    expect(screen.getByTestId('request-history')).toBeInTheDocument()
    expect(screen.getByTestId('booking-dialog')).toBeInTheDocument()
  })

  it('displays welcome message with user name', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'John Doe', email: 'john@example.com' } },
      status: 'authenticated',
    })

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lessons: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })

    render(<MemberDashboard />)

    await screen.findByText('title')

    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('fetches lessons and requests on mount', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockLessons = [
      {
        id: '1',
        lessonDate: '2026-03-20',
        startTime: '10:00',
        endTime: '11:30',
        lessonType: 'private_badminton',
        duration: 1.5,
        price: 75,
        status: 'scheduled',
        notes: null,
        court: { name: 'Court 1' },
        students: [],
      },
    ]

    const mockRequests = [
      {
        id: '1',
        requestedDate: '2026-03-21',
        requestedTime: '14:00',
        lessonType: 'group_badminton',
        requestedDuration: 2,
        status: 'pending',
        adminNotes: null,
        suggestedTime: null,
        createdAt: '2026-03-15T10:00:00Z',
      },
    ]

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lessons: mockLessons }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })

    render(<MemberDashboard />)

    await screen.findByTestId('stats-cards')

    expect(global.fetch).toHaveBeenCalledWith('/api/member/lessons')
    expect(global.fetch).toHaveBeenCalledWith('/api/member/requests')
  })
})
