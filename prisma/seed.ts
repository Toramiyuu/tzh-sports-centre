import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create 4 courts
  const courts = [
    { name: 'Court 1', description: 'Standard badminton court', hourlyRate: 30.0 },
    { name: 'Court 2', description: 'Standard badminton court', hourlyRate: 30.0 },
    { name: 'Court 3', description: 'Standard badminton court', hourlyRate: 30.0 },
    { name: 'Court 4', description: 'Premium court with better lighting', hourlyRate: 35.0 },
  ]

  for (const court of courts) {
    await prisma.court.upsert({
      where: { id: courts.indexOf(court) + 1 },
      update: {},
      create: court,
    })
  }

  console.log('Created 4 courts')

  // Create time slots from 9 AM to 12 AM (midnight)
  // Each slot is 1 hour: 9:00-10:00, 10:00-11:00, ..., 23:00-00:00
  const timeSlots = []
  for (let hour = 9; hour <= 23; hour++) {
    const slotTime = `${hour.toString().padStart(2, '0')}:00`
    const ampm = hour < 12 ? 'AM' : 'PM'
    const displayHour = hour <= 12 ? hour : hour - 12
    const displayName = `${displayHour}:00 ${ampm}`

    timeSlots.push({
      slotTime,
      displayName: hour === 12 ? '12:00 PM' : displayName,
    })
  }

  for (let i = 0; i < timeSlots.length; i++) {
    await prisma.timeSlot.upsert({
      where: { id: i + 1 },
      update: {},
      create: timeSlots[i],
    })
  }

  console.log(`Created ${timeSlots.length} time slots (9 AM - 12 AM)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
