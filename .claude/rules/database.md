# Database Schema Patterns

Prisma conventions for `prisma/schema.prisma`.

## Naming Convention

- **Models:** PascalCase (`User`, `Court`, `LessonRequest`)
- **Fields:** camelCase (`createdAt`, `isAdmin`, `creditBalance`)
- **DB columns:** snake_case via `@map()` directive

```prisma
model User {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now()) @map("created_at")
  emailVerifyToken String? @map("email_verify_token")

  @@map("users")
}
```

## Standard Fields

Every model should have:

```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

## Soft Deletes

Use `deletedAt` for soft deletes:

```prisma
deletedAt DateTime? @map("deleted_at")
```

**Never** hard-delete user data. Mark as deleted instead:

```typescript
// ✅ Soft delete
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() }
})

// ❌ Hard delete
await prisma.user.delete({ where: { id } })
```

Query non-deleted:

```typescript
await prisma.user.findMany({
  where: { deletedAt: null }
})
```

## Primary Keys

- **Auto-increment numeric:** `@id @default(autoincrement())`
- **CUID string:** `@id @default(cuid())`

Main models use CUID for security (non-sequential). Lookup tables use auto-increment.

## Unique Identifiers

Combine CUID with auto-increment UID for user-facing IDs:

```prisma
model User {
  id   String @id @default(cuid())  // Internal use
  uid  BigInt @unique @default(autoincrement())  // User-facing
}
```

## Relations

Always define both sides:

```prisma
model User {
  id       String    @id @default(cuid())
  bookings Booking[]
}

model Booking {
  id     String @id @default(cuid())
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id])
}
```

## Boolean Defaults

Explicitly set boolean defaults:

```prisma
isActive Boolean @default(true) @map("is_active")
isAdmin  Boolean @default(false) @map("is_admin")
```

## Enums

For fixed sets of values, use Prisma enums:

```prisma
enum BookingStatus {
  PENDING
  APPROVED
  CANCELLED
  EXPIRED
}

model Booking {
  status BookingStatus @default(PENDING)
}
```

## Why

- snake_case DB columns follow PostgreSQL conventions
- camelCase fields match TypeScript naming
- Soft deletes preserve audit trail
- Consistent patterns make schema predictable
