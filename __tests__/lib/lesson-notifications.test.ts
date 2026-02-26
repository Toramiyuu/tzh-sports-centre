import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { createMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  notifyLessonCreated,
  notifyLessonCancelled,
  notifyLessonRescheduled,
} from '@/lib/lesson-notifications'

describe('lesson-notifications', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('notifyLessonCreated', () => {
    it('creates notifications for all student ids', async () => {
      vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 2 })

      await notifyLessonCreated({
        studentIds: ['u1', 'u2'],
        lessonType: 'Private',
        lessonDate: '2026-03-01',
        startTime: '09:00',
        endTime: '10:30',
        courtName: 'Court 1',
      })

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'u1',
            type: 'lesson_created',
          }),
          expect.objectContaining({
            userId: 'u2',
            type: 'lesson_created',
          }),
        ]),
      })
    })

    it('skips if no student ids', async () => {
      await notifyLessonCreated({
        studentIds: [],
        lessonType: 'Private',
        lessonDate: '2026-03-01',
        startTime: '09:00',
        endTime: '10:30',
        courtName: 'Court 1',
      })

      expect(prisma.notification.createMany).not.toHaveBeenCalled()
    })
  })

  describe('notifyLessonCancelled', () => {
    it('creates cancellation notifications', async () => {
      vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 1 })

      await notifyLessonCancelled({
        studentIds: ['u1'],
        lessonType: 'Group',
        lessonDate: '2026-03-01',
        startTime: '09:00',
        reason: 'Coach unavailable',
      })

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'u1',
            type: 'lesson_cancelled',
            title: 'Lesson Cancelled',
          }),
        ],
      })
    })
  })

  describe('notifyLessonRescheduled', () => {
    it('creates reschedule notifications with old and new times', async () => {
      vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 1 })

      await notifyLessonRescheduled({
        studentIds: ['u1'],
        lessonType: 'Private',
        oldDate: '2026-03-01',
        oldTime: '09:00',
        newDate: '2026-03-02',
        newTime: '10:00',
        courtName: 'Court 2',
      })

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'u1',
            type: 'lesson_rescheduled',
            title: 'Lesson Rescheduled',
          }),
        ],
      })
    })
  })
})
