---
name: testing-strategy
description: |
  Testing setup guide for this Next.js 16 + TypeScript + Prisma project.
  Use when: (1) adding tests to the project, (2) setting up test infrastructure,
  (3) writing tests for API routes, components, or database logic, (4) user asks
  about testing approach. Covers Vitest for unit tests and Playwright for E2E tests.
author: Claude Code
version: 1.1.0
---

# Testing Strategy for TZH Sports Centre

## Overview

This Next.js project uses **Vitest** for unit/integration tests and **Playwright** for E2E tests.

## Current Stack

| Test Type | Framework | Purpose |
|-----------|-----------|---------|
| Unit/Integration | Vitest | API routes, utilities, React components |
| E2E | Playwright | User flows, integration tests |

## Vitest Configuration

### Existing Setup

The project already has Vitest configured in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### Test Scripts

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

### Test Location

All tests are in `__tests__/*.test.ts`.

## Writing Tests with Vitest

### Example: Testing Validation Helpers

From `__tests__/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateMalaysianPhone, validateEmail } from '@/lib/validation'

describe('validateMalaysianPhone', () => {
  it('accepts valid Malaysian mobile numbers', () => {
    expect(validateMalaysianPhone('0123456789')).toBe('0123456789')
    expect(validateMalaysianPhone('+60123456789')).toBe('+60123456789')
  })

  it('rejects invalid numbers', () => {
    expect(validateMalaysianPhone('12345')).toBeNull()
    expect(validateMalaysianPhone('abc')).toBeNull()
  })
})

describe('validateEmail', () => {
  it('accepts valid emails and lowercases', () => {
    expect(validateEmail('Test@Example.COM')).toBe('test@example.com')
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('not-an-email')).toBeNull()
  })
})
```

### Testing API Routes

Mock external dependencies:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/courts/route'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    court: {
      findMany: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

describe('GET /api/courts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns courts when authenticated', async () => {
    const mockSession = { user: { email: 'test@example.com' } }
    vi.mocked(auth).mockResolvedValue(mockSession)

    const mockCourts = [
      { id: 1, name: 'Court 1', isActive: true },
    ]
    vi.mocked(prisma.court.findMany).mockResolvedValue(mockCourts)

    const request = new NextRequest('http://localhost:3000/api/courts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCourts)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/courts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })
})
```

### Testing React Components

For React components, update Vitest config to use `jsdom`:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom', // Change from 'node' to 'jsdom'
    globals: true,
    setupFiles: ['./vitest.setup.ts'], // Add setup file
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

Install dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

Example test:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Playwright for E2E Tests

### Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

Add script to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Example E2E Test

Create `e2e/booking-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('user can book a court', async ({ page }) => {
  // Login
  await page.goto('/auth/login')
  await page.fill('input[name="identifier"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to booking page
  await page.goto('/booking')

  // Select date
  await page.click('button[name="date-today"]')

  // Select time slot
  await page.click('button:has-text("9:00 AM")')

  // Submit booking
  await page.click('button:has-text("Confirm Booking")')

  // Verify success
  await expect(page.locator('text=Booking confirmed')).toBeVisible()
})
```

## Best Practices

1. **Test location**: Keep tests in `__tests__/` directory
2. **Mock external services**: Mock Prisma, auth, external APIs
3. **Test behavior**: Focus on what users see/get, not implementation
4. **Descriptive names**: `it('returns 401 when not authenticated', ...)`
5. **Clean up**: Use `vi.clearAllMocks()` in `beforeEach`
6. **Test edge cases**: Invalid input, missing data, error states
7. **Keep tests fast**: Mock heavy operations

## Common Patterns

### Testing Admin-Only Routes

```typescript
it('returns 403 for non-admin users', async () => {
  vi.mocked(auth).mockResolvedValue({ user: { email: 'user@example.com' } })
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ isAdmin: false })

  const response = await GET(request)
  expect(response.status).toBe(403)
})
```

### Testing Validation Errors

```typescript
it('returns 400 for invalid phone number', async () => {
  const request = new NextRequest('http://localhost:3000/api/register', {
    method: 'POST',
    body: JSON.stringify({ phone: 'invalid' }),
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(400)
  expect(data.error).toContain('Invalid phone')
})
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
