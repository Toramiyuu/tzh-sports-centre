import { vi } from "vitest";

/**
 * Create a mock Prisma model with all CRUD methods stubbed
 */
export function createMockPrismaModel() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

/**
 * Create a complete mock Prisma client with all models
 */
export function createMockPrismaClient() {
  return {
    user: createMockPrismaModel(),
    court: createMockPrismaModel(),
    booking: createMockPrismaModel(),
    recurringBooking: createMockPrismaModel(),
    recurringBookingPayment: createMockPrismaModel(),
    coachAvailability: createMockPrismaModel(),
    lessonSession: createMockPrismaModel(),
    lessonRequest: createMockPrismaModel(),
    monthlyPayment: createMockPrismaModel(),
    paymentTransaction: createMockPrismaModel(),
    stringingOrder: createMockPrismaModel(),
    stringStock: createMockPrismaModel(),
    stringStockLog: createMockPrismaModel(),
    shopProduct: createMockPrismaModel(),
    shopOrder: createMockPrismaModel(),
    racketProfile: createMockPrismaModel(),
    notification: createMockPrismaModel(),
    trialRequest: createMockPrismaModel(),
    auditLog: createMockPrismaModel(),
    absence: createMockPrismaModel(),
    replacementCredit: createMockPrismaModel(),
    replacementBooking: createMockPrismaModel(),
    gameSession: createMockPrismaModel(),
    sessionAttendance: createMockPrismaModel(),
    match: createMockPrismaModel(),
    matchPlayer: createMockPrismaModel(),
    playerPoints: createMockPrismaModel(),
    playerProfile: createMockPrismaModel(),
    teacher: createMockPrismaModel(),
    teacherPayRate: createMockPrismaModel(),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}
