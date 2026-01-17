import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateUids() {
  console.log('Starting UID migration...')

  // Get all users ordered by their current UID
  const users = await prisma.user.findMany({
    orderBy: { uid: 'asc' },
    select: { id: true, uid: true, name: true, email: true },
  })

  console.log(`Found ${users.length} users to migrate`)

  // Update each user with a new sequential UID starting from 1
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const newUid = BigInt(i + 1)

    console.log(`Updating ${user.name} (${user.email}): ${user.uid} -> ${newUid}`)

    await prisma.user.update({
      where: { id: user.id },
      data: { uid: newUid },
    })
  }

  console.log('UID migration completed!')

  // Verify the migration
  const updatedUsers = await prisma.user.findMany({
    orderBy: { uid: 'asc' },
    select: { id: true, uid: true, name: true, email: true },
  })

  console.log('\nUpdated UIDs:')
  for (const user of updatedUsers) {
    console.log(`  ${user.uid.toString().padStart(3, '0')} - ${user.name} (${user.email})`)
  }
}

migrateUids()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
