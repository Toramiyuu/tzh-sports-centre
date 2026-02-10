import { Prisma, PrismaClient } from '@prisma/client'
import { SHOP_PRODUCTS } from '../lib/shop-config'

const prisma = new PrismaClient()

function jsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
}

async function main() {
  console.log('Seeding shop products...')

  for (const product of SHOP_PRODUCTS) {
    const data = {
      category: product.category,
      subcategory: product.subcategory || null,
      brand: product.brand,
      name: product.name,
      fullName: product.fullName,
      price: product.price,
      description: product.description || null,
      specs: jsonOrNull(product.specs),
      image: product.image,
      images: jsonOrNull(product.images),
      colors: jsonOrNull(product.colors),
      sizes: jsonOrNull(product.sizes),
      inStock: product.inStock,
      featured: product.featured || false,
    }

    await prisma.shopProduct.upsert({
      where: { productId: product.id },
      update: data,
      create: { productId: product.id, ...data },
    })
    console.log(`  Seeded: ${product.fullName}`)
  }

  const count = await prisma.shopProduct.count()
  console.log(`\nDone! ${count} products in database.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
