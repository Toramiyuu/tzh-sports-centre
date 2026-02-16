# Malaysian Validation Patterns

All validation helpers live in `lib/validation.ts`. Use these instead of inline validation.

## Phone Numbers

**Malaysian mobile format:** `+60123456789`, `0123456789`, or `01234567890`

```typescript
import { validateMalaysianPhone } from '@/lib/validation'

const cleaned = validateMalaysianPhone(input)
if (!cleaned) {
  return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
}
```

Returns cleaned number or `null` if invalid.

## Email

```typescript
import { validateEmail } from '@/lib/validation'

const email = validateEmail(input)
if (!email) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
}
```

Returns lowercase trimmed email or `null`.

## Sport Types

```typescript
import { validateSport } from '@/lib/validation'

const sport = validateSport(input) // 'badminton' | 'pickleball' | null
if (!sport) {
  return NextResponse.json({ error: 'Invalid sport' }, { status: 400 })
}
```

## Payment Methods

```typescript
import { validatePaymentMethod } from '@/lib/validation'

const method = validatePaymentMethod(input) // 'tng' | 'duitnow' | null
if (!method) {
  return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
}
```

## Future Dates

```typescript
import { validateFutureDate } from '@/lib/validation'

const date = validateFutureDate(input, allowToday = true)
if (!date) {
  return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
}
```

## String Tension (18-35 lbs)

```typescript
import { validateTension } from '@/lib/validation'

const tension = validateTension(input)
if (!tension) {
  return NextResponse.json({ error: 'Tension must be 18-35 lbs' }, { status: 400 })
}
```

## Why

Centralized validation prevents inconsistencies and makes updates easier. All helpers return `null` on invalid input for consistent error handling.
