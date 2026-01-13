import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'TZH Sports Centre <noreply@tzh-sports.com>'
const SUPPORT_EMAIL = 'support@tzh-sports.com'

interface BookingDetails {
  bookingId: string
  customerName: string
  customerEmail: string
  sport: string
  date: string
  startTime: string
  endTime: string
  courtName: string
  totalAmount: number
}

export async function sendBookingConfirmation(booking: BookingDetails) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: `Booking Confirmed - ${booking.sport} on ${booking.date}`,
      html: generateBookingConfirmationHtml(booking),
    })

    if (error) {
      console.error('Failed to send booking confirmation:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendBookingReminder(booking: BookingDetails) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping reminder')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: `Reminder: Your ${booking.sport} booking is tomorrow!`,
      html: generateBookingReminderHtml(booking),
    })

    if (error) {
      console.error('Failed to send booking reminder:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendCancellationNotice(booking: BookingDetails, creditRefunded?: number) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping cancellation notice')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: `Booking Cancelled - ${booking.sport} on ${booking.date}`,
      html: generateCancellationHtml(booking, creditRefunded),
    })

    if (error) {
      console.error('Failed to send cancellation notice:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// HTML Email Templates
function generateBookingConfirmationHtml(booking: BookingDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">TZH Sports Centre</h1>
              <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Booking Confirmation</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                  ✓ Booking Confirmed
                </div>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi <strong>${booking.customerName}</strong>,<br><br>
                Your court booking has been confirmed! Here are your booking details:
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">Sport:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${booking.sport}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Date:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${booking.date}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Time:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${booking.startTime} - ${booking.endTime}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Court:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${booking.courtName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Total:</td>
                        <td style="color: #2563eb; font-size: 18px; font-weight: 700;">RM${booking.totalAmount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>Payment:</strong> Please pay at the counter when you arrive.
              </p>

              <!-- Location -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Location:</p>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      TZH Sports Centre<br>
                      Jalan Sekolah La Salle, 11400 Ayer Itam, Penang
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                Questions? Contact us at 011-6868 8508
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Booking ID: ${booking.bookingId}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function generateBookingReminderHtml(booking: BookingDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">TZH Sports Centre</h1>
              <p style="color: #fef3c7; margin: 8px 0 0 0; font-size: 14px;">Booking Reminder</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                  ⏰ Tomorrow
                </div>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi <strong>${booking.customerName}</strong>,<br><br>
                Just a friendly reminder that your ${booking.sport.toLowerCase()} booking is tomorrow!
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #fde68a;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                      <tr>
                        <td style="color: #92400e; font-size: 14px; width: 120px;">Sport:</td>
                        <td style="color: #78350f; font-size: 14px; font-weight: 600;">${booking.sport}</td>
                      </tr>
                      <tr>
                        <td style="color: #92400e; font-size: 14px;">Date:</td>
                        <td style="color: #78350f; font-size: 14px; font-weight: 600;">${booking.date}</td>
                      </tr>
                      <tr>
                        <td style="color: #92400e; font-size: 14px;">Time:</td>
                        <td style="color: #78350f; font-size: 14px; font-weight: 600;">${booking.startTime} - ${booking.endTime}</td>
                      </tr>
                      <tr>
                        <td style="color: #92400e; font-size: 14px;">Court:</td>
                        <td style="color: #78350f; font-size: 14px; font-weight: 600;">${booking.courtName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                See you there! Don't forget to bring your equipment.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                Need to cancel? Contact us at 011-6868 8508
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function generateCancellationHtml(booking: BookingDetails, creditRefunded?: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">TZH Sports Centre</h1>
              <p style="color: #d1d5db; margin: 8px 0 0 0; font-size: 14px;">Booking Cancelled</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi <strong>${booking.customerName}</strong>,<br><br>
                Your booking has been cancelled. Here are the details:
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">Sport:</td>
                        <td style="color: #111827; font-size: 14px;">${booking.sport}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Date:</td>
                        <td style="color: #111827; font-size: 14px;">${booking.date}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Time:</td>
                        <td style="color: #111827; font-size: 14px;">${booking.startTime} - ${booking.endTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${creditRefunded ? `
              <div style="background-color: #dcfce7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0;">
                  ✓ Credit Refund: RM${creditRefunded.toFixed(2)} has been added to your account
                </p>
              </div>
              ` : ''}

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                We hope to see you again soon!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Questions? Contact us at 011-6868 8508
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
