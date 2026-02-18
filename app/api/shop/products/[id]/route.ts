import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.shopProduct.findFirst({
      where: {
        OR: [
          { productId: id },
          { id: id },
        ],
      },
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching shop product:', error)
    return NextResponse.json(
      { message: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.shopProduct.findFirst({
      where: {
        OR: [
          { productId: id },
          { id: id },
        ],
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    const product = await prisma.shopProduct.update({
      where: { id: existing.id },
      data: {
        ...(body.category !== undefined && { category: body.category }),
        ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.specs !== undefined && { specs: body.specs }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.colors !== undefined && { colors: body.colors }),
        ...(body.colorImages !== undefined && { colorImages: body.colorImages }),
        ...(body.sizes !== undefined && { sizes: body.sizes }),
        ...(body.inStock !== undefined && { inStock: body.inStock }),
        ...(body.stockCount !== undefined && { stockCount: body.stockCount }),
        ...(body.featured !== undefined && { featured: body.featured }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating shop product:', error)
    return NextResponse.json(
      { message: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const existing = await prisma.shopProduct.findFirst({
      where: {
        OR: [
          { productId: id },
          { id: id },
        ],
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    await prisma.shopProduct.delete({
      where: { id: existing.id },
    })

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Error deleting shop product:', error)
    return NextResponse.json(
      { message: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
