import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sendEmail,
  getEmailVerificationEmail,
  getBookingExpirationWarningEmail,
  getBookingExpiredEmail,
  getBookingConfirmedEmail,
} from '@/lib/email'

const { mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockSendMail = vi.fn()
  const mockCreateTransport = vi.fn(() => ({
    sendMail: mockSendMail,
  }))
  return { mockSendMail, mockCreateTransport }
})

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}))

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs warning and skips sending when SMTP not configured', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>',
    })

    expect(result.success).toBe(true)
    expect(result.skipped).toBe(true)
    expect(result.data).toBeNull()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Gmail not configured')
    )

    consoleWarnSpy.mockRestore()
  })

  it('accepts valid email parameters', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    })

    expect(result.success).toBe(true)
  })
})

describe('getEmailVerificationEmail', () => {
  it('returns correct subject', () => {
    const email = getEmailVerificationEmail({
      userName: 'John Doe',
      verifyUrl: 'https://example.com/verify/abc123',
    })

    expect(email.subject).toBe('Verify your new email - TZH Sports Centre')
  })

  it('includes user name in HTML', () => {
    const email = getEmailVerificationEmail({
      userName: 'John Doe',
      verifyUrl: 'https://example.com/verify/abc123',
    })

    expect(email.html).toContain('Hi John Doe')
  })

  it('includes verification URL in HTML', () => {
    const email = getEmailVerificationEmail({
      userName: 'John Doe',
      verifyUrl: 'https://example.com/verify/abc123',
    })

    expect(email.html).toContain('href="https://example.com/verify/abc123"')
  })

  it('includes 24-hour expiry notice', () => {
    const email = getEmailVerificationEmail({
      userName: 'John Doe',
      verifyUrl: 'https://example.com/verify/abc123',
    })

    expect(email.html).toContain('24 hours')
  })
})

describe('getBookingExpirationWarningEmail', () => {
  it('returns correct subject with hours remaining', () => {
    const email = getBookingExpirationWarningEmail({
      userName: 'Jane Smith',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 1',
      hoursRemaining: 12,
    })

    expect(email.subject).toBe('Action Required: Your booking will expire in 12 hours')
  })

  it('includes all booking details in HTML', () => {
    const email = getBookingExpirationWarningEmail({
      userName: 'Jane Smith',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 1',
      hoursRemaining: 12,
    })

    expect(email.html).toContain('Hi Jane Smith')
    expect(email.html).toContain('Court 1')
    expect(email.html).toContain('Monday, 17 Feb 2026')
    expect(email.html).toContain('14:00 - 15:00')
  })

  it('includes expiration warning message', () => {
    const email = getBookingExpirationWarningEmail({
      userName: 'Jane Smith',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 1',
      hoursRemaining: 12,
    })

    expect(email.html).toContain('will expire in 12 hours')
  })
})

describe('getBookingExpiredEmail', () => {
  it('returns correct subject', () => {
    const email = getBookingExpiredEmail({
      userName: 'Bob Johnson',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 2',
    })

    expect(email.subject).toBe('Your booking has expired - TZH Sports Centre')
  })

  it('includes all booking details in HTML', () => {
    const email = getBookingExpiredEmail({
      userName: 'Bob Johnson',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 2',
    })

    expect(email.html).toContain('Hi Bob Johnson')
    expect(email.html).toContain('Court 2')
    expect(email.html).toContain('Monday, 17 Feb 2026')
    expect(email.html).toContain('14:00 - 15:00')
  })

  it('includes expired message', () => {
    const email = getBookingExpiredEmail({
      userName: 'Bob Johnson',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 2',
    })

    expect(email.html).toContain('expired')
    expect(email.html).toContain('cancelled')
  })

  it('includes booking CTA link', () => {
    const email = getBookingExpiredEmail({
      userName: 'Bob Johnson',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 2',
    })

    expect(email.html).toContain('Book Now')
    expect(email.html).toContain('/booking')
  })
})

describe('getBookingConfirmedEmail', () => {
  it('returns correct subject', () => {
    const email = getBookingConfirmedEmail({
      userName: 'Alice Lee',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 3',
      sport: 'Badminton',
      totalAmount: 75.50,
    })

    expect(email.subject).toBe('Booking Confirmed - TZH Sports Centre')
  })

  it('includes all booking details in HTML', () => {
    const email = getBookingConfirmedEmail({
      userName: 'Alice Lee',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 3',
      sport: 'Badminton',
      totalAmount: 75.50,
    })

    expect(email.html).toContain('Hi Alice Lee')
    expect(email.html).toContain('Badminton')
    expect(email.html).toContain('Court 3')
    expect(email.html).toContain('Monday, 17 Feb 2026')
    expect(email.html).toContain('14:00 - 15:00')
  })

  it('formats total amount correctly', () => {
    const email = getBookingConfirmedEmail({
      userName: 'Alice Lee',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 3',
      sport: 'Badminton',
      totalAmount: 75.50,
    })

    expect(email.html).toContain('RM75.50')
  })

  it('includes confirmation message', () => {
    const email = getBookingConfirmedEmail({
      userName: 'Alice Lee',
      bookingDate: 'Monday, 17 Feb 2026',
      bookingTime: '14:00 - 15:00',
      courtName: 'Court 3',
      sport: 'Badminton',
      totalAmount: 75.50,
    })

    expect(email.html).toContain('confirmed')
  })
})
