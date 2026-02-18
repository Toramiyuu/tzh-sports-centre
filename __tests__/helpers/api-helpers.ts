import { NextRequest } from 'next/server'
import { vi, expect } from 'vitest'

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockNextRequest({
  method = 'GET',
  url = 'http://localhost:3000/api/test',
  body = null,
  headers = {},
  searchParams = {},
}: {
  method?: string
  url?: string
  body?: Record<string, unknown> | null
  headers?: Record<string, string>
  searchParams?: Record<string, string>
} = {}): NextRequest {
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const req = new NextRequest(urlObj, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  })

  return req
}

/**
 * Create a mock auth() function for testing authenticated routes
 */
export function createMockAuth(session: Record<string, unknown> | null = null) {
  return vi.fn().mockResolvedValue(session)
}

/**
 * Assert that a NextResponse has the expected status and JSON body
 */
export async function expectJsonResponse(
  response: Response,
  status: number,
  bodyMatcher?: Record<string, unknown>
) {
  expect(response.status).toBe(status)
  const json = await response.json()
  if (bodyMatcher) {
    expect(json).toMatchObject(bodyMatcher)
  }
  return json
}

/**
 * Session fixtures for common test scenarios
 */
export const fixtures = {
  adminSession: {
    user: {
      id: 'admin-user-id',
      email: 'admin@test.com',
      name: 'Admin User',
      isAdmin: true,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },

  userSession: {
    user: {
      id: 'regular-user-id',
      email: 'user@test.com',
      name: 'Regular User',
      isAdmin: false,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },

  memberSession: {
    user: {
      id: 'member-user-id',
      email: 'member@test.com',
      name: 'Member User',
      isAdmin: false,
      isMember: true,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },

  guestSession: null,
}
