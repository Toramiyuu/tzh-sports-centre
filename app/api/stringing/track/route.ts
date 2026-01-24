import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobUid, phone } = body

    // Validation
    if (!jobUid || !phone) {
      return NextResponse.json(
        { message: 'Job UID and phone number are required' },
        { status: 400 }
      )
    }

    // Normalize phone number for comparison
    // Remove all non-digit characters
    const normalizedPhone = phone.replace(/\D/g, '')

    // Find the order by Job UID
    const order = await prisma.stringingOrder.findUnique({
      where: { jobUid },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found', found: false },
        { status: 404 }
      )
    }

    // Normalize stored phone for comparison
    const storedPhone = order.customerPhone.replace(/\D/g, '')

    // Strip Malaysian country code (60) and leading zeros to get the core number
    function getCoreNumber(digits: string): string {
      if (digits.startsWith('60')) {
        digits = digits.slice(2)
      }
      if (digits.startsWith('0')) {
        digits = digits.slice(1)
      }
      return digits
    }

    // Compare core numbers (the part after country code and leading zero)
    const phoneMatches =
      storedPhone === normalizedPhone ||
      getCoreNumber(storedPhone) === getCoreNumber(normalizedPhone)

    if (!phoneMatches) {
      return NextResponse.json(
        { message: 'Phone number does not match', found: false },
        { status: 404 }
      )
    }

    // Return order details for tracking (excluding sensitive info)
    return NextResponse.json({
      found: true,
      order: {
        jobUid: order.jobUid,
        status: order.status,
        stringName: order.stringName,
        stringColor: order.stringColor,
        price: order.priceFinal || order.price,
        racketModel: order.racketModel,
        racketModelCustom: order.racketModelCustom,
        tensionMain: order.tensionMain,
        tensionCross: order.tensionCross,
        pickupDate: order.pickupDate,
        notes: order.notes,
        receivedAt: order.receivedAt,
        inProgressAt: order.inProgressAt,
        readyAt: order.readyAt,
        collectedAt: order.collectedAt,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error('Error tracking stringing order:', error)
    return NextResponse.json(
      { message: 'Failed to track order' },
      { status: 500 }
    )
  }
}
