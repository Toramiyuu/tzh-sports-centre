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

  // Create time slots from 9 AM to 12 AM (midnight) in 30-minute increments
  // Slots: 9:00, 9:30, 10:00, 10:30, ..., 23:00, 23:30
  const timeSlots = []
  for (let hour = 9; hour <= 23; hour++) {
    for (const minutes of ['00', '30']) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${minutes}`
      const ampm = hour < 12 ? 'AM' : 'PM'
      const displayHour = hour <= 12 ? hour : hour - 12
      let displayName = `${displayHour}:${minutes} ${ampm}`

      // Fix edge cases
      if (hour === 12) {
        displayName = `12:${minutes} PM`
      }

      timeSlots.push({
        slotTime,
        displayName,
      })
    }
  }

  // Delete existing time slots and recreate
  await prisma.timeSlot.deleteMany({})

  for (let i = 0; i < timeSlots.length; i++) {
    await prisma.timeSlot.create({
      data: {
        id: i + 1,
        ...timeSlots[i],
      },
    })
  }

  console.log(`Created ${timeSlots.length} time slots (9 AM - 12 AM, 30-min increments)`)
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
