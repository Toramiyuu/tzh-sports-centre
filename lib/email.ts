import nodemailer from 'nodemailer'

// Gmail SMTP configuration
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null

const FROM_EMAIL = process.env.GMAIL_USER || 'noreply@tzh-sports.com'
const FROM_NAME = 'TZH Sports Centre'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // If Gmail is not configured, log and return
  if (!transporter) {
    console.warn(`[Email] Gmail not configured - would send to ${to}: ${subject}`)
    return { success: true, data: null, skipped: true }
  }

  try {
    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })

    return { success: true, data: info }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Email Templates

export function getBookingExpirationWarningEmail(params: {
  userName: string
  bookingDate: string
  bookingTime: string
  courtName: string
  hoursRemaining: number
}) {
  const { userName, bookingDate, bookingTime, courtName, hoursRemaining } = params

  return {
    subject: `Action Required: Your booking will expire in ${hoursRemaining} hours`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .booking-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TZH Sports Centre</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>

              <div class="warning">
                <strong>Your booking is awaiting confirmation and will expire in ${hoursRemaining} hours.</strong>
              </div>

              <p>Your booking details:</p>
              <div class="booking-details">
                <p><strong>Court:</strong> ${courtName}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Time:</strong> ${bookingTime}</p>
              </div>

              <p>Please contact us if you have any questions about your booking status.</p>

              <p>Best regards,<br>TZH Sports Centre Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from TZH Sports Centre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getBookingExpiredEmail(params: {
  userName: string
  bookingDate: string
  bookingTime: string
  courtName: string
}) {
  const { userName, bookingDate, bookingTime, courtName } = params

  return {
    subject: 'Your booking has expired - TZH Sports Centre',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .expired { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
            .booking-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .cta { text-align: center; margin: 20px 0; }
            .cta a { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TZH Sports Centre</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>

              <div class="expired">
                <strong>Your booking has expired as it was not confirmed in time.</strong>
              </div>

              <p>The following booking has been cancelled:</p>
              <div class="booking-details">
                <p><strong>Court:</strong> ${courtName}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Time:</strong> ${bookingTime}</p>
              </div>

              <p>The time slot is now available for other customers to book.</p>

              <p>If you'd like to make a new booking, please visit our website:</p>
              <div class="cta">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tzh-sports-centre.vercel.app'}/booking">Book Now</a>
              </div>

              <p>We apologize for any inconvenience. If you have questions, please contact us.</p>

              <p>Best regards,<br>TZH Sports Centre Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from TZH Sports Centre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getBookingConfirmedEmail(params: {
  userName: string
  bookingDate: string
  bookingTime: string
  courtName: string
  sport: string
  totalAmount: number
}) {
  const { userName, bookingDate, bookingTime, courtName, sport, totalAmount } = params

  return {
    subject: 'Booking Confirmed - TZH Sports Centre',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .confirmed { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
            .booking-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TZH Sports Centre</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>

              <div class="confirmed">
                <strong>Great news! Your booking has been confirmed.</strong>
              </div>

              <p>Your booking details:</p>
              <div class="booking-details">
                <p><strong>Sport:</strong> ${sport}</p>
                <p><strong>Court:</strong> ${courtName}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Time:</strong> ${bookingTime}</p>
                <p><strong>Amount:</strong> RM${totalAmount.toFixed(2)}</p>
              </div>

              <p>We look forward to seeing you!</p>

              <p>Best regards,<br>TZH Sports Centre Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from TZH Sports Centre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
