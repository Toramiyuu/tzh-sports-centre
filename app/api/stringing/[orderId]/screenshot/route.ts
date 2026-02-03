import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

// POST - Upload payment screenshot for a stringing order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { screenshot } = body

    if (!screenshot) {
      return NextResponse.json(
        { message: 'Screenshot is required' },
        { status: 400 }
      )
    }

    // Validate it's a base64 image
    if (!screenshot.startsWith('data:image/')) {
      return NextResponse.json(
        { message: 'Invalid image format' },
        { status: 400 }
      )
    }

    // Check image size (max 5MB)
    const sizeInBytes = (screenshot.length * 3) / 4
    if (sizeInBytes > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Image is too large (max 5MB)' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.stringingOrder.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order with screenshot
    const updatedOrder = await prisma.stringingOrder.update({
      where: { id: orderId },
      data: {
        paymentScreenshotUrl: screenshot,
        paymentStatus: 'pending_verification',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      order: {
        id: updatedOrder.id,
        paymentStatus: updatedOrder.paymentStatus,
      },
    })
  } catch (error) {
    console.error('Error uploading screenshot:', error)
    return NextResponse.json(
      { message: 'Failed to upload screenshot' },
      { status: 500 }
    )
  }
}

// GET - Get screenshot for an order (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await params

    const order = await prisma.stringingOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentScreenshotUrl: true,
        paymentStatus: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      screenshot: order.paymentScreenshotUrl,
      paymentStatus: order.paymentStatus,
    })
  } catch (error) {
    console.error('Error fetching screenshot:', error)
    return NextResponse.json(
      { message: 'Failed to fetch screenshot' },
      { status: 500 }
    )
  }
}
