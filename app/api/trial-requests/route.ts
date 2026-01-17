import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Submit a new trial request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, preferredLessonType, preferredDate, preferredTime, message } = body

    // Validate required fields
    if (!name || !phone || !preferredLessonType) {
      return NextResponse.json(
        { error: 'Name, phone, and preferred lesson type are required' },
        { status: 400 }
      )
    }

    // Validate phone format (Malaysian format)
    const phoneRegex = /^01\d{8,9}$/
    const cleanPhone = phone.replace(/[\s-]/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid Malaysian phone number' },
        { status: 400 }
      )
    }

    // Create trial request
    const trialRequest = await prisma.trialRequest.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email?.trim() || null,
        preferredLessonType,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime: preferredTime || null,
        message: message?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Trial request submitted successfully',
      id: trialRequest.id,
    })
  } catch (error) {
    console.error('Error creating trial request:', error)
    return NextResponse.json(
      { error: 'Failed to submit trial request' },
      { status: 500 }
    )
  }
}
