import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courts = [
    {
      name: "Court 1",
      description: "Standard badminton court",
      hourlyRate: 15.0,
    },
    {
      name: "Court 2",
      description: "Standard badminton court",
      hourlyRate: 15.0,
    },
    {
      name: "Court 3",
      description: "Standard badminton court",
      hourlyRate: 15.0,
    },
    {
      name: "Court 4",
      description: "Standard badminton court",
      hourlyRate: 15.0,
    },
  ];

  for (const court of courts) {
    await prisma.court.upsert({
      where: { id: courts.indexOf(court) + 1 },
      update: {},
      create: court,
    });
  }

  console.log("Created 4 courts");

  const timeSlots = [];
  for (let hour = 9; hour <= 23; hour++) {
    for (const minutes of ["00", "30"]) {
      const slotTime = `${hour.toString().padStart(2, "0")}:${minutes}`;
      const ampm = hour < 12 ? "AM" : "PM";
      const displayHour = hour <= 12 ? hour : hour - 12;
      let displayName = `${displayHour}:${minutes} ${ampm}`;

      if (hour === 12) {
        displayName = `12:${minutes} PM`;
      }

      timeSlots.push({
        slotTime,
        displayName,
      });
    }
  }

  await prisma.timeSlot.deleteMany({});

  for (let i = 0; i < timeSlots.length; i++) {
    await prisma.timeSlot.create({
      data: {
        id: i + 1,
        ...timeSlots[i],
      },
    });
  }

  console.log(
    `Created ${timeSlots.length} time slots (9 AM - 12 AM, 30-min increments)`,
  );

  const lessonTypes = [
    {
      name: "1-to-1 Private",
      slug: "1-to-1",
      billingType: "per_session",
      price: 130,
      maxStudents: 1,
      description: "Private one-on-one coaching",
      detailedDescription:
        "Get undivided attention from our coach with personalized training tailored to your skill level and goals. Perfect for players who want to improve quickly.",
      pricingTiers: [
        { duration: 1.5, price: 130 },
        { duration: 2, price: 160 },
      ],
    },
    {
      name: "1-to-2",
      slug: "1-to-2",
      billingType: "per_session",
      price: 160,
      maxStudents: 2,
      description: "Semi-private lesson for 2 students",
      detailedDescription:
        "Train with a friend or family member in this semi-private format. Enjoy more personal attention while practicing competitive drills together.",
      pricingTiers: [
        { duration: 1.5, price: 160 },
        { duration: 2, price: 180 },
      ],
    },
    {
      name: "1-to-3",
      slug: "1-to-3",
      billingType: "per_session",
      price: 180,
      maxStudents: 3,
      description: "Small group lesson for 3 students (2 hours only)",
      detailedDescription:
        "Small group training with match-style drills. A great balance between individual attention and group dynamics.",
      pricingTiers: [{ duration: 2, price: 180 }],
    },
    {
      name: "1-to-4",
      slug: "1-to-4",
      billingType: "per_session",
      price: 200,
      maxStudents: 4,
      description: "Small group lesson for 4 students (2 hours only)",
      detailedDescription:
        "Team-style training in a fun, social environment. Best value per person while still getting quality coaching.",
      pricingTiers: [{ duration: 2, price: 200 }],
    },
    {
      name: "Small Group Kids (Beginners)",
      slug: "small-kids-beginners",
      billingType: "monthly",
      price: 50,
      maxStudents: 6,
      sessionsPerMonth: 4,
      description: "Monthly kids beginner group - 4 sessions/month",
      detailedDescription:
        "Introduction to badminton for young beginners. Fun-based learning approach that builds fundamental skills and love for the sport.",
      pricingTiers: [],
    },
    {
      name: "Large Group Kids",
      slug: "large-kids",
      billingType: "monthly",
      price: 100,
      maxStudents: 12,
      sessionsPerMonth: 4,
      description: "Monthly kids group - 4 sessions/month",
      detailedDescription:
        "Group training for kids focusing on drills, fitness, and coordination. Great for developing teamwork and social skills.",
      pricingTiers: [],
    },
    {
      name: "Large Group Kids (Intermediate)",
      slug: "large-kids-intermediate",
      billingType: "monthly",
      price: 140,
      maxStudents: 12,
      sessionsPerMonth: 4,
      description: "Monthly intermediate kids group - 4 sessions/month",
      detailedDescription:
        "Higher intensity training for intermediate players. Focus on match tactics, competitive play, and advanced techniques.",
      pricingTiers: [],
    },
    {
      name: "Small Adult Group",
      slug: "small-adult-group",
      billingType: "per_session",
      price: 50,
      maxStudents: 6,
      description: "Adult group lesson (2 hours only)",
      detailedDescription:
        "Social training for adults focusing on fitness, technique refinement, and enjoying the game with others.",
      pricingTiers: [{ duration: 2, price: 50 }],
    },
  ];

  for (const lt of lessonTypes) {
    const { pricingTiers, ...data } = lt;
    const record = await prisma.lessonType.upsert({
      where: { name: lt.name },
      update: {
        slug: data.slug,
        description: data.description,
        detailedDescription: data.detailedDescription,
        billingType: data.billingType,
        price: data.price,
        maxStudents: data.maxStudents,
        sessionsPerMonth: data.sessionsPerMonth ?? null,
      },
      create: data,
    });

    for (const tier of pricingTiers) {
      await prisma.lessonTypePricing.upsert({
        where: {
          lessonTypeId_duration: {
            lessonTypeId: record.id,
            duration: tier.duration,
          },
        },
        update: { price: tier.price },
        create: {
          lessonTypeId: record.id,
          duration: tier.duration,
          price: tier.price,
        },
      });
    }
  }

  console.log(`Seeded ${lessonTypes.length} lesson types with pricing tiers`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
