import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
const mockRedirect = vi.fn(() => { throw new Error('NEXT_REDIRECT') })
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))
vi.mock('@/components/admin/LessonTypesContent', () => ({
  default: () => 'LessonTypesContent',
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

describe('LessonTypesPage', () => {
  it('redirects unauthenticated users to login', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { default: Page } = await import('@/app/admin/lesson-types/page')
    await expect(Page()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith(
      '/auth/login?callbackUrl=/admin/lesson-types'
    )
  })

  it('redirects non-admin users to home', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: 'user@test.com', isAdmin: false },
    } as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const { default: Page } = await import('@/app/admin/lesson-types/page')
    await expect(Page()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })
})
