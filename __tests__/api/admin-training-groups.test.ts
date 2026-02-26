/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PATCH, DELETE } from '@/app/api/admin/training-groups/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trainingGroup: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

const mockGroup = {
  id: 'group-1',
  name: 'Adult Group 1',
  sport: 'badminton',
  notes: null,
  isActive: true,
  members: [
    { id: 'user-1', uid: 1, name: 'John', phone: '0123456789', skillLevel: 'intermediate' },
    { id: 'user-2', uid: 2, name: 'Jane', phone: '0123456780', skillLevel: 'beginner' },
  ],
}

describe('GET /api/admin/training-groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const response = await GET()
    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns list of active training groups', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.trainingGroup.findMany).mockResolvedValue([mockGroup] as never)

    const response = await GET()
    const json = await expectJsonResponse(response, 200)

    expect(json.groups).toHaveLength(1)
    expect(json.groups[0].name).toBe('Adult Group 1')
    expect(json.groups[0].members).toHaveLength(2)
  })
})

describe('POST /api/admin/training-groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin users', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { name: 'Test Group' },
    })
    const response = await POST(request)
    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns 400 when name is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { sport: 'badminton' },
    })
    const response = await POST(request)
    await expectJsonResponse(response, 400, { error: 'Group name is required' })
  })

  it('returns 409 when group name already exists', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.trainingGroup.findUnique).mockResolvedValue(mockGroup as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { name: 'Adult Group 1' },
    })
    const response = await POST(request)
    await expectJsonResponse(response, 409)
  })

  it('creates a new training group with members', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.trainingGroup.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.trainingGroup.create).mockResolvedValue(mockGroup as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { name: 'Adult Group 1', sport: 'badminton', memberIds: ['user-1', 'user-2'] },
    })
    const response = await POST(request)
    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.group.name).toBe('Adult Group 1')
    expect(prisma.trainingGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Adult Group 1',
          sport: 'badminton',
          members: { connect: [{ id: 'user-1' }, { id: 'user-2' }] },
        }),
      }),
    )
  })
})

describe('PATCH /api/admin/training-groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when id is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { name: 'Updated Name' },
    })
    const response = await PATCH(request)
    await expectJsonResponse(response, 400, { error: 'Group ID is required' })
  })

  it('returns 404 when group does not exist', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.trainingGroup.findUnique).mockResolvedValue(null as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { id: 'nonexistent', name: 'Updated' },
    })
    const response = await PATCH(request)
    await expectJsonResponse(response, 404, { error: 'Group not found' })
  })

  it('updates group name and members', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.trainingGroup.findUnique)
      .mockResolvedValueOnce(mockGroup as never)
      .mockResolvedValueOnce(null as never)
    vi.mocked(prisma.trainingGroup.update).mockResolvedValue({
      ...mockGroup,
      name: 'Renamed Group',
    } as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { id: 'group-1', name: 'Renamed Group', memberIds: ['user-1'] },
    })
    const response = await PATCH(request)
    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.group.name).toBe('Renamed Group')
  })
})

describe('DELETE /api/admin/training-groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when id is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: {},
    })
    const response = await DELETE(request)
    await expectJsonResponse(response, 400, { error: 'Group ID is required' })
  })

  it('soft deletes a group by setting isActive to false', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.trainingGroup.update).mockResolvedValue({ ...mockGroup, isActive: false } as never)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/training-groups',
      body: { id: 'group-1' },
    })
    const response = await DELETE(request)
    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(prisma.trainingGroup.update).toHaveBeenCalledWith({
      where: { id: 'group-1' },
      data: { isActive: false },
    })
  })
})
