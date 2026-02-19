import { describe, it, expect } from 'vitest'
import { createMockPrismaModel, createMockPrismaClient } from './prisma-mock'

describe('createMockPrismaModel', () => {
  it('should return an object with all CRUD methods as vi.fn()', () => {
    const model = createMockPrismaModel()
    expect(typeof model.findUnique).toBe('function')
    expect(typeof model.findFirst).toBe('function')
    expect(typeof model.findMany).toBe('function')
    expect(typeof model.create).toBe('function')
    expect(typeof model.createMany).toBe('function')
    expect(typeof model.update).toBe('function')
    expect(typeof model.updateMany).toBe('function')
    expect(typeof model.upsert).toBe('function')
    expect(typeof model.delete).toBe('function')
    expect(typeof model.deleteMany).toBe('function')
    expect(typeof model.count).toBe('function')
    expect(typeof model.aggregate).toBe('function')
    expect(typeof model.groupBy).toBe('function')
  })
})

describe('createMockPrismaClient', () => {
  it('should include all standard models', () => {
    const client = createMockPrismaClient()
    expect(client.user).toBeDefined()
    expect(client.court).toBeDefined()
    expect(client.booking).toBeDefined()
    expect(client.lessonSession).toBeDefined()
    expect(client.notification).toBeDefined()
  })

  it('should include absence system models', () => {
    const client = createMockPrismaClient()
    expect(client.absence).toBeDefined()
    expect(client.replacementCredit).toBeDefined()
  })

  it('should include replacementBooking model', () => {
    const client = createMockPrismaClient()
    expect(client.replacementBooking).toBeDefined()
    expect(typeof client.replacementBooking.findMany).toBe('function')
    expect(typeof client.replacementBooking.create).toBe('function')
    expect(typeof client.replacementBooking.update).toBe('function')
    expect(typeof client.replacementBooking.findFirst).toBe('function')
    expect(typeof client.replacementBooking.findUnique).toBe('function')
  })

  it('should include gamification models', () => {
    const client = createMockPrismaClient()
    expect(client.gameSession).toBeDefined()
    expect(client.sessionAttendance).toBeDefined()
    expect(client.match).toBeDefined()
    expect(client.matchPlayer).toBeDefined()
    expect(client.playerPoints).toBeDefined()
    expect(client.playerProfile).toBeDefined()
  })

  it('should include all CRUD methods on gamification models', () => {
    const client = createMockPrismaClient()
    expect(typeof client.gameSession.findMany).toBe('function')
    expect(typeof client.gameSession.create).toBe('function')
    expect(typeof client.sessionAttendance.upsert).toBe('function')
    expect(typeof client.match.create).toBe('function')
    expect(typeof client.matchPlayer.findMany).toBe('function')
    expect(typeof client.playerPoints.upsert).toBe('function')
    expect(typeof client.playerProfile.upsert).toBe('function')
  })

  it('should include transaction and raw query methods', () => {
    const client = createMockPrismaClient()
    expect(typeof client.$transaction).toBe('function')
    expect(typeof client.$queryRaw).toBe('function')
    expect(typeof client.$executeRaw).toBe('function')
  })
})
