import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}))

vi.mock('@/lib/absence', () => ({
  checkExpiringCredits: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { checkExpiringCredits } from '@/lib/absence'
import { POST as uploadProof } from '@/app/api/upload/absence-proof/route'
import { GET as cronExpiry } from '@/app/api/cron/credit-expiry/route'

describe('POST /api/upload/absence-proof', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/upload/absence-proof',
    })
    const res = await uploadProof(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
  })

  it('returns 400 when no file is provided', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    const formData = new FormData()
    const req = new Request('http://localhost:3000/api/upload/absence-proof', {
      method: 'POST',
      body: formData,
    })
    const res = await uploadProof(req as never)
    await expectJsonResponse(res, 400, { error: 'No file provided' })
  })

  it('returns 400 for invalid file type', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    const formData = new FormData()
    const pdfBlob = new Blob(['%PDF'], { type: 'application/pdf' })
    formData.append('file', pdfBlob, 'doc.pdf')
    const req = new Request('http://localhost:3000/api/upload/absence-proof', {
      method: 'POST',
      body: formData,
    })
    const res = await uploadProof(req as never)
    await expectJsonResponse(res, 400, { error: expect.stringContaining('Invalid file type') as unknown as string })
  })

  it('uploads valid image and returns url', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(put).mockResolvedValue({
      url: 'https://blob.example.com/absence-proofs/proof-123.jpg',
    } as never)

    const formData = new FormData()
    const imgBlob = new Blob(['fake-image'], { type: 'image/jpeg' })
    formData.append('file', imgBlob, 'mc.jpg')
    const req = new Request('http://localhost:3000/api/upload/absence-proof', {
      method: 'POST',
      body: formData,
    })
    const res = await uploadProof(req as never)
    const json = await expectJsonResponse(res, 200)
    expect(json.success).toBe(true)
    expect(json.url).toContain('blob.example.com')
    expect(put).toHaveBeenCalledWith(
      expect.stringContaining('absence-proofs/') as unknown as string,
      expect.any(Blob),
      expect.objectContaining({ access: 'public' }) as unknown
    )
  })
})

describe('GET /api/cron/credit-expiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.CRON_SECRET
  })

  it('returns 401 when CRON_SECRET is not configured (fail-closed)', async () => {
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/cron/credit-expiry',
    })
    const res = await cronExpiry(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
    expect(checkExpiringCredits).not.toHaveBeenCalled()
  })

  it('returns 401 when CRON_SECRET is set and authorization header is missing', async () => {
    process.env.CRON_SECRET = 'test-secret'
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/cron/credit-expiry',
    })
    const res = await cronExpiry(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
  })

  it('succeeds when CRON_SECRET matches authorization header', async () => {
    process.env.CRON_SECRET = 'test-secret'
    vi.mocked(checkExpiringCredits).mockResolvedValue(0)
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/cron/credit-expiry',
      headers: { authorization: 'Bearer test-secret' },
    })
    const res = await cronExpiry(req)
    await expectJsonResponse(res, 200)
    expect(checkExpiringCredits).toHaveBeenCalledOnce()
  })
})
