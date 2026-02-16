# API Route Conventions

Standard patterns for Next.js API routes in `app/api/`.

## Basic Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Logic here
    const data = await prisma.model.findMany()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Admin Check

```typescript
const session = await auth()

if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { isAdmin: true }
})

if (!user?.isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Error Responses

Use consistent error format:

```typescript
return NextResponse.json({ error: 'Message here' }, { status: 4xx })
```

Common status codes:
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (logged in but not allowed)
- `404` - Not Found
- `500` - Internal Server Error

## Validation

Always validate input using helpers from `lib/validation.ts`:

```typescript
import { validateMalaysianPhone, validateEmail } from '@/lib/validation'

const phone = validateMalaysianPhone(body.phone)
if (!phone) {
  return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
}
```

## Prisma Usage

Import singleton:

```typescript
import { prisma } from '@/lib/prisma'
```

**Never** create new `PrismaClient()` instances in API routes.

## Common Mistakes

❌ Don't check `session.user.isAdmin` directly - it's not in the session
✅ Query the database for `user.isAdmin`

❌ Don't return raw error objects
✅ Return `{ error: 'message' }` structure

❌ Don't forget try/catch
✅ Wrap async logic in try/catch
