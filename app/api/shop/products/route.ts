import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

// GET /api/shop/products - list products with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const inStock = searchParams.get('inStock')

    const where: Record<string, unknown> = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (brand) {
      where.brand = brand
    }

    if (featured === 'true') {
      where.featured = true
      where.inStock = true
    }

    if (inStock === 'true') {
      where.inStock = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.shopProduct.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching shop products:', error)
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/shop/products - create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      productId, category, subcategory, brand, name, fullName,
      price, description, specs, image, images, colors, sizes,
      inStock, stockCount, featured,
    } = body

    if (!productId || !category || !brand || !name || !fullName || price == null || !image) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.shopProduct.create({
      data: {
        productId,
        category,
        subcategory: subcategory || null,
        brand,
        name,
        fullName,
        price,
        description: description || null,
        specs: specs || null,
        image,
        images: images || null,
        colors: colors || null,
        sizes: sizes || null,
        inStock: inStock ?? true,
        stockCount: stockCount ?? 0,
        featured: featured ?? false,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating shop product:', error)
    return NextResponse.json(
      { message: 'Failed to create product' },
      { status: 500 }
    )
  }
}
