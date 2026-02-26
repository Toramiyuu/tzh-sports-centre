import { describe, it, expect } from 'vitest'
import { calculateUserLessonCharges } from '@/lib/lesson-billing-utils'

function makeLessons(
  overrides: Array<{
    id?: string
    billingType?: string
    price?: number
    students?: Array<{ id: string }>
    attendances?: Array<{ userId: string; status: string }>
    duration?: number
  }>,
) {
  return overrides.map((o, i) => ({
    id: o.id ?? `lesson-${i}`,
    lessonDate: new Date('2026-02-15'),
    lessonType: 'group',
    billingType: o.billingType ?? 'per_session',
    startTime: '09:00',
    endTime: '10:30',
    duration: o.duration ?? 1.5,
    price: o.price ?? 100,
    court: { name: 'Court 1' },
    students: o.students ?? [{ id: 'user-1' }, { id: 'user-2' }],
    attendances: o.attendances ?? [],
  }))
}

describe('calculateUserLessonCharges', () => {
  it('should return zero for user not in any lesson', () => {
    const lessons = makeLessons([{ students: [{ id: 'other-user' }] }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(0)
    expect(result.lessonCount).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('should split price equally among students', () => {
    const lessons = makeLessons([{
      price: 100,
      students: [{ id: 'user-1' }, { id: 'user-2' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(50)
    expect(result.items[0].pricePerStudent).toBe(50)
  })

  it('should charge per-session only when attended (no attendance record = attended)', () => {
    const lessons = makeLessons([{
      billingType: 'per_session',
      price: 100,
      students: [{ id: 'user-1' }],
      attendances: [],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(100)
    expect(result.items[0].attended).toBe(true)
  })

  it('should charge per-session when status is PRESENT', () => {
    const lessons = makeLessons([{
      billingType: 'per_session',
      price: 80,
      students: [{ id: 'user-1' }],
      attendances: [{ userId: 'user-1', status: 'PRESENT' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(80)
    expect(result.items[0].attended).toBe(true)
  })

  it('should charge per-session when status is LATE', () => {
    const lessons = makeLessons([{
      billingType: 'per_session',
      price: 80,
      students: [{ id: 'user-1' }],
      attendances: [{ userId: 'user-1', status: 'LATE' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(80)
  })

  it('should NOT charge per-session when ABSENT', () => {
    const lessons = makeLessons([{
      billingType: 'per_session',
      price: 80,
      students: [{ id: 'user-1' }],
      attendances: [{ userId: 'user-1', status: 'ABSENT' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(0)
    expect(result.items[0].attended).toBe(false)
    expect(result.items[0].amount).toBe(0)
  })

  it('should charge monthly billing regardless of attendance', () => {
    const lessons = makeLessons([{
      billingType: 'monthly',
      price: 120,
      students: [{ id: 'user-1' }],
      attendances: [{ userId: 'user-1', status: 'ABSENT' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(120)
    expect(result.items[0].attended).toBe(false)
    expect(result.items[0].amount).toBe(120)
  })

  it('should aggregate across multiple lessons', () => {
    const lessons = makeLessons([
      { price: 100, students: [{ id: 'user-1' }], duration: 1 },
      { price: 60, students: [{ id: 'user-1' }, { id: 'user-2' }], duration: 1.5 },
    ])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(100 + 30)
    expect(result.lessonCount).toBe(2)
    expect(result.totalHours).toBe(2.5)
  })

  it('should populate item fields correctly', () => {
    const lessons = makeLessons([{
      id: 'lesson-42',
      billingType: 'per_session',
      price: 90,
      duration: 1.5,
      students: [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    const item = result.items[0]
    expect(item.lessonSessionId).toBe('lesson-42')
    expect(item.lessonDate).toBe('2026-02-15')
    expect(item.billingType).toBe('per_session')
    expect(item.court).toBe('Court 1')
    expect(item.totalStudents).toBe(3)
    expect(item.pricePerStudent).toBe(30)
  })

  it('should NOT charge per-session when EXCUSED', () => {
    const lessons = makeLessons([{
      billingType: 'per_session',
      price: 80,
      students: [{ id: 'user-1' }],
      attendances: [{ userId: 'user-1', status: 'EXCUSED' }],
    }])
    const result = calculateUserLessonCharges('user-1', lessons)
    expect(result.totalAmount).toBe(0)
    expect(result.items[0].attended).toBe(false)
  })
})
