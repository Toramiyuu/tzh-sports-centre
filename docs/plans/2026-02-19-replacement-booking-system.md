# Replacement Booking System Implementation Plan

Created: 2026-02-19
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** Set at plan creation (from dispatcher). `No` works directly on current branch

## Summary

**Goal:** Allow students with unused replacement credits (earned from Module 1 absences) to self-service book replacement lesson sessions, eliminating WhatsApp back-and-forth for replacement scheduling.

**Architecture:** New `ReplacementBooking` Prisma model links a `ReplacementCredit` to a target `LessonSession`. API routes handle listing available sessions (filtered by capacity), booking, and cancellation. Student UI is a new tab/section within the profile absences tab. Admin gets a read-only view of all replacement bookings. Slot availability is derived from the existing `maxStudents` in `lesson-config.ts` minus current enrolled students and confirmed replacement bookings.

**Tech Stack:** Next.js 16 App Router, Prisma/PostgreSQL, Vitest, next-intl, Tailwind + Radix UI

## Scope

### In Scope

- `ReplacementBooking` Prisma model + enum + migration
- `ReplacementCredit` relation back to `ReplacementBooking`
- API: GET available sessions, POST book replacement, DELETE cancel replacement
- API: GET admin replacement bookings list
- Student UI: replacement booking flow within absences tab (credit list → browse available → confirm booking → view upcoming replacements)
- Admin UI: replacement bookings section on admin absences page
- i18n translations (EN/ZH/MS) for replacement namespace
- Notifications for booking confirmation and cancellation

### Out of Scope

- `LessonSlotConfig` model (per-session `allowReplacement` / `allowExtraClass` overrides) — deferred to Module 3 (Extra Class Booking) when admin config UI is needed
- Extra class booking (paid sessions) — Module 3
- Sport type filtering — current codebase stores `lessonType` not sport; all lessons are badminton. Will filter by lesson type compatibility instead (replacement into same `lessonType`)
- Admin ability to manually assign replacement bookings (admin can view only)

## Prerequisites

- Module 1 (Absence System) deployed — `Absence`, `ReplacementCredit` models exist ✅
- Database has `replacement_credits` table with `used_at`, `expires_at` fields ✅
- Student profile has Absences tab with credits display ✅

## Context for Implementer

- **Patterns to follow:** Follow the absence API route pattern in `app/api/absences/route.ts` — auth check → user lookup → validation → transaction → notification → response
- **Conventions:** snake_case DB columns via `@map()`, camelCase TS fields, CUID IDs, `createdAt`/`updatedAt` standard fields, `@@map("table_name")` on all models
- **Key files:**
  - `prisma/schema.prisma` — Add `ReplacementBooking` model and enum
  - `lib/lesson-config.ts` — `LESSON_TYPES[].maxStudents` determines slot capacity
  - `lib/absence.ts` — Existing replacement credit logic
  - `components/profile/AbsencesTab.tsx` — Student UI entry point for replacement booking
  - `app/admin/absences/page.tsx` — Admin page to extend with replacement bookings section
  - `__tests__/helpers/prisma-mock.ts` — Add `replacementBooking` to mock client
- **Gotchas:**
  - `LessonSession.students` is a many-to-many relation (`@relation("StudentLessons")`). Students in a session are enrolled members. Replacement students should NOT be added to this relation — they get a separate `ReplacementBooking` record that references the session.
  - `maxStudents` from `lesson-config.ts` is per lesson TYPE, not per session. Availability = `maxStudents - session.students.length - confirmedReplacements`.
  - Credits have a 30-day expiry (`expiresAt`). Only unused + unexpired credits can be redeemed.
  - The `usedAt` field on `ReplacementCredit` gets set when booking is confirmed. On cancellation (>24h before), `usedAt` is cleared back to null.
- **Domain context:** Students who apply for absence ≥7 days before a lesson get a replacement credit. They can use this credit to join another session of the same lesson type, as long as there's space. They should only see sessions they're not already enrolled in and that are in the future.

## Runtime Environment

- **Start command:** `npm run dev`
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`
- **Restart procedure:** Stop and re-run `npm run dev` (or Next.js hot-reloads on file changes)

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Prisma schema + migration
- [x] Task 2: Replacement booking API routes
- [x] Task 3: Student UI — replacement booking flow
- [x] Task 4: Admin UI — replacement bookings section
- [x] Task 5: i18n translations
- [x] Task 6: Notifications + credit lifecycle

**Total Tasks:** 6 | **Completed:** 6 | **Remaining:** 0

## Implementation Tasks

### Task 1: Prisma Schema + Migration

**Objective:** Add `ReplacementBooking` model, `ReplacementBookingStatus` enum, and relation from `ReplacementCredit` back to `ReplacementBooking`. Run migration.

**Dependencies:** None

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `__tests__/helpers/prisma-mock.ts` (add `replacementBooking` model)

**Key Decisions / Notes:**

- Add `ReplacementBookingStatus` enum: `CONFIRMED`, `CANCELLED`, `COMPLETED`
- `ReplacementBooking` has: `id`, `userId`, `replacementCreditId` (unique), `lessonSessionId`, `status`, `createdAt`, `updatedAt`
- Relations: `user` → User, `replacementCredit` → ReplacementCredit (1:1), `lessonSession` → LessonSession
- Add `replacementBooking` optional relation on `ReplacementCredit` model
- Add `replacementBookings` array on `User` and `LessonSession` models
- Add indexes on `userId` and `lessonSessionId`
- Follow existing snake_case `@@map` conventions — table: `replacement_bookings`
- Update `__tests__/helpers/prisma-mock.ts` to include `replacementBooking: createMockPrismaModel()`
- Run `npx prisma migrate dev --name add_replacement_bookings`

**Definition of Done:**

- [ ] `ReplacementBooking` model exists in `prisma/schema.prisma` with all fields and relations
- [ ] `ReplacementBookingStatus` enum exists with CONFIRMED, CANCELLED, COMPLETED values
- [ ] `ReplacementCredit` model has optional `replacementBooking` relation
- [ ] Migration applied successfully: `npx prisma migrate status` shows "up to date"
- [ ] `prisma generate` runs without errors
- [ ] Mock client updated with `replacementBooking` model

**Verify:**

- `npx prisma validate` — schema is valid
- `npx prisma migrate status` — all migrations applied
- `npm test -- __tests__/helpers/prisma-mock.ts` — mock compiles (no direct test, but import check)

---

### Task 2: Replacement Booking API Routes

**Objective:** Create API routes for listing available sessions, booking a replacement, cancelling a booking, and admin listing all replacement bookings.

**Dependencies:** Task 1

**Files:**

- Create: `app/api/replacement/available/route.ts` — GET available sessions
- Create: `app/api/replacement/book/route.ts` — POST book replacement
- Create: `app/api/replacement/[id]/route.ts` — DELETE cancel replacement
- Create: `app/api/admin/replacement/route.ts` — GET all replacement bookings
- Create: `__tests__/api/replacement.test.ts` — tests for all 3 student routes
- Create: `__tests__/api/admin-replacement.test.ts` — tests for admin route

**Key Decisions / Notes:**

- **GET /api/replacement/available:**
  - Auth required (user must be logged in)
  - Query: `lessonType` (optional filter, defaults to showing all types)
  - Returns future `LessonSession`s where: status = "scheduled", `lessonDate > now`, user is NOT already enrolled, user does NOT already have a confirmed replacement booking for that session
  - For each session: calculate `availableSlots = maxStudents(lessonType) - students.length - confirmedReplacementBookings.length`
  - Only return sessions with `availableSlots > 0`
  - Include: `lessonDate`, `startTime`, `endTime`, `court.name`, `lessonType`, `availableSlots`
  - Paginated: default 20 per page

- **POST /api/replacement/book:**
  - Auth required
  - Body: `{ creditId, lessonSessionId }`
  - Validate: credit belongs to user, credit is unused + unexpired, session exists + is future + has slots
  - Atomic transaction: create `ReplacementBooking` (status: CONFIRMED) + set `usedAt = now()` on the credit
  - Return the created booking

- **DELETE /api/replacement/[id]:**
  - Auth required
  - Validate: booking belongs to user, booking status is CONFIRMED
  - If session is >24h away: cancel booking + clear `usedAt` on credit (credit returned)
  - If session is ≤24h away: cancel booking but credit is NOT returned (forfeited)
  - Update booking status to CANCELLED

- **GET /api/admin/replacement:**
  - Admin auth required
  - Returns all replacement bookings with user info, credit info, session info
  - Filterable by status, paginated

- Follow the auth check pattern from `app/api/absences/route.ts:12-24`
- Follow the admin check pattern from `app/api/admin/absences/route.ts`
- Use `prisma.$transaction` for the booking operation to prevent race conditions (check slot availability + book atomically)

**Definition of Done:**

- [ ] GET `/api/replacement/available` returns sessions with available slots, excluding user's own sessions and already-booked sessions
- [ ] POST `/api/replacement/book` creates booking and marks credit as used in a single transaction
- [ ] DELETE `/api/replacement/[id]` cancels booking, returns credit if >24h before session, forfeits credit if ≤24h
- [ ] GET `/api/admin/replacement` returns paginated list of all replacement bookings (admin only)
- [ ] All routes return proper error codes (401, 400, 404, 409, 500)
- [ ] Tests cover happy path + error cases for all routes

**Verify:**

- `npm test -- __tests__/api/replacement.test.ts` — all student route tests pass
- `npm test -- __tests__/api/admin-replacement.test.ts` — admin route tests pass
- `npm run build` — no type errors

---

### Task 3: Student UI — Replacement Booking Flow

**Objective:** Add replacement booking UI within the AbsencesTab — students can see their credits, browse available sessions, and book replacements with a confirmation dialog.

**Dependencies:** Task 2, Task 5

**Files:**

- Create: `components/profile/ReplacementBookingSection.tsx` — main replacement booking component
- Modify: `components/profile/AbsencesTab.tsx` — integrate ReplacementBookingSection below credits card

**Key Decisions / Notes:**

- **ReplacementBookingSection** is rendered inside AbsencesTab when user has ≥1 unused credit
- Shows a "Book Replacement" button that expands to show available sessions
- Available sessions displayed as a list: date, time, court, lesson type, slots remaining (e.g., "2/6 spots")
- Clicking a session opens a confirmation dialog: shows session details + which credit will be used (first expiring credit auto-selected, user can choose another)
- After booking: show success toast, refresh data, new booking appears in "My Replacement Sessions" section
- "My Replacement Sessions" section shows upcoming confirmed replacement bookings with cancel button
- Cancel button shows confirmation with warning about credit forfeiture if ≤24h
- Loading states, empty states ("No available sessions"), error handling
- Follow existing component patterns: use Card, Badge, Button from `@/components/ui/*`
- Use theme-aware colors (no hardcoded hex) per `dark-mode.md`
- Keep component under 300 lines — split if needed

**Definition of Done:**

- [ ] Students with unused credits see "Book Replacement" section in absences tab
- [ ] Clicking "Book Replacement" shows list of available sessions with slot counts
- [ ] Confirmation dialog shows session details and credit to be used
- [ ] After booking, credit count decreases and booking appears in "My Replacement Sessions"
- [ ] Cancel button works: credit returned if >24h, forfeited if ≤24h (with warning)
- [ ] Empty states render for no credits, no available sessions, no bookings
- [ ] Build compiles with no errors

**Verify:**

- `npm run build` — no type errors
- Manual verification: navigate to `/profile?tab=absences`, see replacement section

---

### Task 4: Admin UI — Replacement Bookings Section

**Objective:** Add a replacement bookings section to the admin absences page showing all replacement bookings in a table.

**Dependencies:** Task 2, Task 5

**Files:**

- Modify: `app/admin/absences/page.tsx` — add replacement bookings table below existing absences content
- Create: `components/admin/ReplacementBookingsTable.tsx` — client component for replacement bookings table

**Key Decisions / Notes:**

- Add a new section below the existing absences table on `/admin/absences`
- Table columns: Student Name, Original Absence Date, Replacement Session Date/Time, Court, Status, Booked At
- Filterable by status (All / CONFIRMED / CANCELLED / COMPLETED)
- Paginated (same pattern as admin absences: page/limit query params)
- Follow existing admin table patterns from `app/admin/absences/page.tsx`
- Use `fetch('/api/admin/replacement')` from client component
- Keep component under 300 lines

**Definition of Done:**

- [ ] Admin absences page shows "Replacement Bookings" section below absences
- [ ] Table displays all replacement bookings with student name, dates, court, status
- [ ] Status filter dropdown works (All/CONFIRMED/CANCELLED/COMPLETED)
- [ ] Empty state shows "No replacement bookings" when table is empty
- [ ] Build compiles with no errors

**Verify:**

- `npm run build` — no type errors
- Manual verification: navigate to `/admin/absences`, see replacement bookings section

---

### Task 5: i18n Translations

**Objective:** Add replacement booking translations to all three locale files (EN, ZH, MS).

**Dependencies:** None

**Files:**

- Modify: `messages/en.json` — add `replacement` namespace
- Modify: `messages/zh.json` — add `replacement` namespace
- Modify: `messages/ms.json` — add `replacement` namespace

**Key Decisions / Notes:**

- Namespace: `replacement`
- Keys needed:
  - `title`: "Replacement Bookings" / "替补课程" / "Kelas Gantian"
  - `bookButton`: "Book Replacement" / "预订替补课" / "Tempah Gantian"
  - `availableSessions`: "Available Sessions" / "可选课程" / "Sesi Tersedia"
  - `slotsAvailable`: "{available}/{max} spots" / "{available}/{max} 名额" / "{available}/{max} tempat"
  - `confirmTitle`: "Confirm Replacement Booking" / "确认替补预订" / "Sahkan Tempahan Gantian"
  - `confirmMessage`: "Use 1 replacement credit to join this session?" / "使用1个替补学分加入此课程？" / "Guna 1 kredit gantian untuk sertai sesi ini?"
  - `creditToUse`: "Credit to use" / "使用学分" / "Kredit digunakan"
  - `expiresOn`: "Expires {date}" / "到期 {date}" / "Tamat {date}"
  - `bookSuccess`: "Replacement booked successfully" / "替补课程预订成功" / "Gantian berjaya ditempah"
  - `cancelConfirm`: "Cancel this replacement booking?" / "取消此替补预订？" / "Batal tempahan gantian ini?"
  - `cancelWarningForfeit`: "Your credit will be forfeited (session is within 24 hours)" / "您的学分将被没收（课程在24小时内）" / "Kredit anda akan dilucutkan (sesi dalam 24 jam)"
  - `cancelWarningReturn`: "Your credit will be returned" / "您的学分将退还" / "Kredit anda akan dikembalikan"
  - `cancelSuccess`: "Replacement cancelled" / "替补已取消" / "Gantian dibatalkan"
  - `myReplacements`: "My Replacement Sessions" / "我的替补课程" / "Sesi Gantian Saya"
  - `noCredits`: "No replacement credits available" / "没有可用的替补学分" / "Tiada kredit gantian tersedia"
  - `noSessions`: "No available sessions" / "没有可选课程" / "Tiada sesi tersedia"
  - `noBookings`: "No replacement bookings yet" / "暂无替补预订" / "Belum ada tempahan gantian"
  - `errors.bookFailed`: "Failed to book replacement" / "替补预订失败" / "Gagal menempah gantian"
  - `errors.cancelFailed`: "Failed to cancel replacement" / "取消替补失败" / "Gagal membatal gantian"
  - `errors.loadFailed`: "Failed to load replacement data" / "加载替补数据失败" / "Gagal memuatkan data gantian"
  - `admin.title`: "Replacement Bookings" / "替补预订" / "Tempahan Gantian"
  - `admin.empty`: "No replacement bookings" / "暂无替补预订" / "Tiada tempahan gantian"
  - `admin.status.CONFIRMED`: "Confirmed" / "已确认" / "Disahkan"
  - `admin.status.CANCELLED`: "Cancelled" / "已取消" / "Dibatalkan"
  - `admin.status.COMPLETED`: "Completed" / "已完成" / "Selesai"

**Definition of Done:**

- [ ] `messages/en.json` has `replacement` namespace with all keys
- [ ] `messages/zh.json` has `replacement` namespace with Chinese translations
- [ ] `messages/ms.json` has `replacement` namespace with Malay translations
- [ ] All three files are valid JSON
- [ ] Build compiles with no errors (no missing key warnings)

**Verify:**

- `node -e "require('./messages/en.json'); require('./messages/zh.json'); require('./messages/ms.json'); console.log('All valid')"` — JSON parses
- `npm run build` — no build errors

---

### Task 6: Notifications + Credit Lifecycle

**Objective:** Send notifications when replacement bookings are confirmed or cancelled, and handle the credit lifecycle (mark used on book, return on cancel if >24h).

**Dependencies:** Task 2

**Files:**

- Modify: `app/api/replacement/book/route.ts` — add notification after successful booking
- Modify: `app/api/replacement/[id]/route.ts` — add notification after cancellation
- Create: `__tests__/api/replacement-notifications.test.ts` — test notification creation

**Key Decisions / Notes:**

- On booking confirmation: create notification for user — "Your replacement session on {date} at {time} has been confirmed. 1 credit used."
- On cancellation (credit returned): "Your replacement for {date} has been cancelled. Credit returned."
- On cancellation (credit forfeited): "Your replacement for {date} has been cancelled. Credit was not returned (within 24 hours of session)."
- Notification type: `replacement_booked` and `replacement_cancelled`
- Link: `/profile?tab=absences`
- Follow existing notification pattern from `app/api/absences/route.ts:123-131`
- Credit lifecycle is handled in the API routes (Task 2) but tests for the notification aspect go here

**Definition of Done:**

- [ ] Booking confirmation creates notification with session date and credit usage info
- [ ] Cancellation creates notification with credit return/forfeit status
- [ ] Notification links to `/profile?tab=absences`
- [ ] Tests verify notification creation for both booking and cancellation scenarios

**Verify:**

- `npm test -- __tests__/api/replacement-notifications.test.ts` — notification tests pass
- `npm test` — all tests pass (no regressions)

## Testing Strategy

- **Unit tests:** `lib/` functions (slot availability calculation), classification logic
- **Integration tests:** API route tests with mocked Prisma — test auth, validation, transaction logic, error codes
- **Manual verification:** Run dev server, log in as a member with replacement credits, browse available sessions, book a replacement, verify it appears in the admin view, cancel and verify credit return

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Race condition: two students book the last slot simultaneously | Med | High | Use `prisma.$transaction` with isolation level: re-check slot count inside transaction before creating booking |
| Student books into a session they're already enrolled in | Low | Med | Filter: exclude sessions where user is already in `students` relation OR has a confirmed `ReplacementBooking` |
| Expired credit used for booking | Low | High | Validate `credit.expiresAt > now()` AND `credit.usedAt === null` inside the transaction |
| Student cancels replacement but credit was already expired | Low | Med | On cancellation, check `credit.expiresAt > now()` before clearing `usedAt` — if expired, credit is not returned regardless of timing |
| Admin absences page becomes too long with two tables | Low | Low | Use collapsible sections or tabs within the admin absences page |

## Open Questions

- None — requirements are clear from PRD Module 2.

### Deferred Ideas

- Per-session `allowReplacement` override (LessonSlotConfig) — deferred to Module 3
- Sport type filtering — all lessons are currently badminton; add when pickleball lessons exist
- Admin manual replacement assignment
- Student rating/feedback after replacement session
