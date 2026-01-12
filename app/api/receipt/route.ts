import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to normalize phone number and create search variants
function getPhoneSearchVariants(phone: string): string[] {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  const variants: string[] = [phone, digitsOnly]

  // If starts with country code 60 (Malaysia), also search without it
  // And try with leading 0 added (some store as +60 014... instead of +60 14...)
  if (digitsOnly.startsWith('60')) {
    const withoutCountry = digitsOnly.slice(2) // Remove 60
    variants.push(withoutCountry)
    variants.push('0' + withoutCountry) // Add leading 0
    // Also try with 60 + 0 + rest (for phones stored as "600143066392")
    if (!withoutCountry.startsWith('0')) {
      variants.push('60' + '0' + withoutCountry)
    }
  }

  // If starts with 0, also search without it (for matching against country code versions)
  if (digitsOnly.startsWith('0')) {
    variants.push(digitsOnly.slice(1)) // Remove leading 0
    variants.push('60' + digitsOnly.slice(1)) // Add country code (without leading 0)
    variants.push('60' + digitsOnly) // Add country code (with leading 0)
  }

  // Also try adding 0 if it doesn't start with 0 or 60
  if (!digitsOnly.startsWith('0') && !digitsOnly.startsWith('60')) {
    variants.push('0' + digitsOnly)
    variants.push('60' + digitsOnly) // Also try with country code
  }

  // IMPORTANT: Add the last 7 digits as a search variant
  // This is the unique part of Malaysian phone numbers and works with any format
  // (formatted phones like "+60 014-3066392" will contain "3066392")
  if (digitsOnly.length >= 7) {
    variants.push(digitsOnly.slice(-7))
  }

  // Remove duplicates
  return [...new Set(variants)]
}

// GET - Fetch bookings by phone number
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Get all phone search variants
    const phoneVariants = getPhoneSearchVariants(phone)

    // Build OR conditions for each variant
    const guestPhoneConditions = phoneVariants.flatMap(variant => [
      { guestPhone: variant },
      { guestPhone: { contains: variant } },
    ])

    const userPhoneConditions = phoneVariants.map(variant => ({
      user: {
        phone: { contains: variant },
      },
    }))

    // Search for bookings by guest phone or user phone
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          ...guestPhoneConditions,
          ...userPhoneConditions,
        ],
      },
      include: {
        court: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'asc' },
      ],
    })

    // Format the response
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      court: booking.court.name,
      sport: booking.sport,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      name: booking.guestName || booking.user?.name || 'Unknown',
      phone: booking.guestPhone || booking.user?.phone || '',
      createdAt: booking.createdAt,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
