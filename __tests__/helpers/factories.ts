/**
 * Test data factories - build complete objects with sensible defaults
 */

export function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    uid: BigInt(1),
    name: 'Test User',
    email: 'test@example.com',
    phone: '0123456789',
    password: '$2a$12$hashedpassword',
    isAdmin: false,
    isMember: false,
    creditBalance: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    emailVerified: null,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    ...overrides,
  }
}

export function buildCourt(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Court 1',
    hourlyRate: 15,
    isActive: true,
    ...overrides,
  }
}

export function buildBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    courtId: 1,
    userId: 'user-1',
    guestName: null,
    guestPhone: null,
    guestEmail: null,
    sport: 'badminton',
    bookingDate: '2026-02-20',
    startTime: '09:00',
    endTime: '10:00',
    totalAmount: 15,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: null,
    paymentUserConfirmed: false,
    receiptUrl: null,
    receiptVerificationStatus: null,
    verifiedAt: null,
    verifiedBy: null,
    expiredAt: null,
    createdAt: new Date('2026-02-17'),
    updatedAt: new Date('2026-02-17'),
    ...overrides,
  }
}

export function buildRecurringBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recurring-1',
    courtId: 1,
    userId: 'user-1',
    guestName: null,
    guestPhone: null,
    guestEmail: null,
    sport: 'badminton',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    startDate: new Date('2026-02-01'),
    endDate: null,
    hourlyRate: null,
    label: null,
    isActive: true,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    ...overrides,
  }
}

export function buildStringingOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    jobUid: 'FEB26-001',
    userId: 'user-1',
    userName: 'Test User',
    userPhone: '0123456789',
    userEmail: 'test@example.com',
    racketBrand: 'Yonex',
    racketModel: 'Astrox 99',
    stringName: 'Yonex BG80',
    stringColor: 'White',
    tensionMain: 25,
    tensionCross: 27,
    pickupDate: new Date('2026-02-20'),
    notes: null,
    totalAmount: 45,
    paymentStatus: 'pending',
    paymentMethod: null,
    receiptUrl: null,
    receiptVerificationStatus: null,
    verifiedAt: null,
    status: 'RECEIVED',
    createdAt: new Date('2026-02-17'),
    updatedAt: new Date('2026-02-17'),
    ...overrides,
  }
}

export function buildLessonSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lesson-1',
    courtId: 1,
    lessonDate: new Date('2026-02-20'),
    startTime: '10:00',
    endTime: '12:00',
    lessonType: 'private-1to1',
    billingType: 'per-session',
    duration: 2,
    price: 130,
    status: 'scheduled',
    notes: null,
    createdAt: new Date('2026-02-17'),
    updatedAt: new Date('2026-02-17'),
    ...overrides,
  }
}

export function buildLessonRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'request-1',
    memberId: 'user-1',
    requestedDate: new Date('2026-02-20'),
    requestedTime: '10:00',
    lessonType: 'private-1to1',
    requestedDuration: 2,
    status: 'pending',
    adminNotes: null,
    suggestedDate: null,
    suggestedTime: null,
    createdAt: new Date('2026-02-17'),
    updatedAt: new Date('2026-02-17'),
    ...overrides,
  }
}

export function buildShopProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    productId: 'yonex-astrox-99',
    category: 'rackets',
    brand: 'Yonex',
    name: 'Astrox 99',
    fullName: 'Yonex Astrox 99',
    price: 450,
    description: 'Professional badminton racket',
    images: ['/images/racket1.jpg'],
    colors: ['Red', 'Blue'],
    sizes: null,
    colorImages: null,
    featured: true,
    inStock: true,
    stockCount: 10,
    createdAt: new Date('2026-02-17'),
    updatedAt: new Date('2026-02-17'),
    ...overrides,
  }
}

export function buildShopOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'shop-order-1',
    userId: 'user-1',
    guestName: null,
    guestPhone: null,
    guestEmail: null,
    items: [
      {
        productId: 'product-1',
        name: 'Yonex Astrox 99',
        quantity: 1,
        price: 450,
      },
    ],
    total: 450,
    status: 'PENDING_PAYMENT',
    paymentStatus: 'pending',
    paymentMethod: null,
    receiptUrl: null,
    notes: null,
    createdAt: new Date('2026-02-17'),
    updatedAt: new Date('2026-02-17'),
    ...overrides,
  }
}
