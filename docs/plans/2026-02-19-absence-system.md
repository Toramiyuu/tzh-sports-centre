# Absence System Implementation Plan

Created: 2026-02-19
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: Yes

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** Set at plan creation (from dispatcher). `Yes` uses git worktree isolation; `No` works directly on current branch (default)

## Summary

**Goal:** Build an absence management system that lets students submit absences for upcoming lessons, auto-classifies them by notice period (≥7 days → replacement credit, 3–6 days → late notice, <3 days → absent, medical → admin review), and gives admins a dashboard to review medical cases and track absence patterns.

**Architecture:** New Prisma models (`Absence`, `ReplacementCredit`) with enums, 5 API routes (3 student-facing, 2 admin), a new "Absences" tab in the student profile, and a new `/admin/absences` page. Follows existing patterns: `auth()` + `isAdmin()` for auth, `lib/validation.ts` for input validation, theme-aware Tailwind for dark mode, `next-intl` for i18n.

**Tech Stack:** TypeScript, Next.js App Router, Prisma/PostgreSQL, Vitest, Tailwind CSS, Radix UI (shadcn), next-intl, Vercel Blob (for MC upload)

## Scope

### In Scope

- Prisma schema: `Absence` model, `ReplacementCredit` model, `AbsenceType` enum, `AbsenceStatus` enum
- User relation updates on `User` and `LessonSession` models
- Validation helpers: `validateAbsenceType` in `lib/validation.ts`, `sanitiseText` (already exists), date-diff classification logic in `lib/absence.ts`
- API routes: POST/GET `/api/absences`, GET `/api/absences/credits`, GET `/api/admin/absences`, PATCH `/api/admin/absences/[id]/review`
- Student UI: New "Absences" tab in profile page with upcoming lessons, apply/notify buttons, credit badge, absence history, and month-grid calendar view of absences
- Admin UI: New `/admin/absences` page with pending review queue, filterable table, review action for medical absences, basic stats
- i18n: `absence` namespace in EN/ZH/MS message files
- Notifications: In-app notifications for absence confirmation and medical review outcomes
- Tests: Unit tests for classification logic, API route tests for all endpoints

### Out of Scope

- Replacement booking (Module 2 — depends on this module's ReplacementCredit model)
- Extra class booking (Module 3)
- Email notifications (only in-app notifications for now)
- Absence rate analytics beyond per-student counts (full charts/dashboards deferred)

## Prerequisites

- PostgreSQL database accessible via `DATABASE_URL`
- Existing `LessonSession` model with student relations (confirmed present in schema)
- Existing `Notification` model (confirmed present in schema)
- Existing upload route at `/api/upload/receipt` (reference pattern for Vercel Blob uploads — NOT directly reusable due to missing auth)
- `BLOB_READ_WRITE_TOKEN` env var for Vercel Blob uploads

## Context for Implementer

> This section is critical for cross-session continuity.

- **Patterns to follow:**
  - API auth check: `auth()` + `isAdmin()` from `@/lib/admin` — see `app/api/admin/lessons/route.ts:13-19`
  - User-facing API auth: `session.user.id` check — see `app/api/profile/lessons/route.ts:9-11`
  - Notification creation: `prisma.notification.create({ data: { userId, type, title, message, link } })` — see `lib/booking-expiration.ts:120-128`
  - File upload: existing `/api/upload/receipt/route.ts` shows the Vercel Blob upload pattern, BUT it has NO authentication (designed for guest uploads). The new absence-proof route MUST add `auth()` check — do NOT copy the receipt route's lack of auth. The receipt route also returns `{ message: '...' }` on errors instead of `{ error: '...' }` — use the standard error format in the new route.
  - Admin page layout: tab-based with `Button variant="ghost"` tabs, `border-b-2` active indicator — see `app/admin/bookings-lessons/page.tsx:80-106`
  - Profile tabs: dynamic tab array, `button` elements with `border-b-2` — see `app/profile/page.tsx:122-173`
  - Data fetching in components: `useState` + `useEffect` + `fetch()` — see `components/profile/LessonsTab.tsx:43-80`
  - Test structure: Vitest with `vi.mock` for `@/lib/auth` and `@/lib/prisma`, test helpers in `__tests__/helpers/api-helpers.ts`

- **Conventions:**
  - Prisma: camelCase fields, snake_case DB columns via `@map()`, `@@map()` for table names
  - All API errors return `{ error: 'message' }` format
  - UI uses theme-aware Tailwind classes only (no hardcoded hex)
  - i18n: `useTranslations('namespace')` for client components, `getTranslations('namespace')` for server components

- **Key files the implementer must read first:**
  - `prisma/schema.prisma` — current schema, LessonSession model at line 168
  - `app/api/admin/lessons/route.ts` — admin API pattern
  - `app/api/profile/lessons/route.ts` — user-facing API pattern
  - `app/profile/page.tsx` — profile tab system
  - `app/admin/bookings-lessons/page.tsx` — admin page with tabs
  - `lib/validation.ts` — existing validation helpers
  - `__tests__/helpers/api-helpers.ts` — test fixtures and helpers

- **Gotchas:**
  - Admin check uses `isAdmin(session.user.email, session.user.isAdmin)` from `@/lib/admin` — NOT `session.user.isAdmin` directly
  - `LessonSession.students` is a many-to-many via implicit join table (`_StudentLessons`)
  - Profile page conditionally shows Lessons tab only for members (`profile?.isMember`)
  - The Absences tab should be visible to ALL members (same condition as Lessons tab)

- **Domain context:**
  - "Apply Absence" = ≥7 days notice, student earns a replacement credit (30-day expiry)
  - "Notify Absence" = <7 days notice, just a record, no replacement credit
  - "Medical" = special case with proof upload, admin decides whether to grant credit
  - The distinction is critical for the UI — button labels must change based on days remaining
  - Malaysia timezone: `Asia/Kuala_Lumpur` (UTC+8) — date comparisons must use `lib/malaysia-time.ts` pattern (convert both dates to YYYY-MM-DD strings in Malaysia timezone before computing day difference). Do NOT use naive UTC day subtraction — a student applying at 11:59 PM MYT would get wrong classification due to UTC offset.

## Runtime Environment

- **Start command:** `npm run dev` (development), `npm start` (production)
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`
- **Build:** `npm run build` (includes `prisma generate`)
- **Migrate:** `npx prisma migrate dev --name add-absence-system`

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Prisma schema — Absence & ReplacementCredit models
- [x] Task 2: Validation helpers & absence classification logic
- [x] Task 3: Student-facing API routes (POST/GET absences, GET credits)
- [x] Task 4: Admin API routes (GET absences, PATCH review)
- [x] Task 5: Student UI — Absences tab in profile
- [x] Task 6: Admin UI — Absences dashboard page
- [x] Task 7: i18n translations (EN/ZH/MS)
- [x] Task 8: Upload route for MC proof & notifications

**Total Tasks:** 8 | **Completed:** 8 | **Remaining:** 0

## Implementation Tasks

### Task 1: Prisma Schema — Absence & ReplacementCredit Models

**Objective:** Add the `Absence` and `ReplacementCredit` models with their enums to the Prisma schema, update `User` and `LessonSession` with new relations, and run the migration.

**Dependencies:** None

**Files:**
- Modify: `prisma/schema.prisma`

**Key Decisions / Notes:**
- Add enums `AbsenceType` (APPLY, LATE_NOTICE, ABSENT, MEDICAL) and `AbsenceStatus` (APPROVED, RECORDED, PENDING_REVIEW, REVIEWED)
- `Absence` has relations to `User` and `LessonSession`
- `ReplacementCredit` has a 1:1 relation to `Absence` (via `@unique` on `absenceId`) and a relation to `User`. Add `updatedAt DateTime @updatedAt @map("updated_at")` to ReplacementCredit (PRD omits it but DB convention requires it on every model — needed for Module 2 when `usedAt` is updated)
- Add `absences` and `replacementCredits` arrays to `User` model
- Add `absences` array to `LessonSession` model
- Follow existing naming: camelCase fields, snake_case columns via `@map()`, `@@map()` for tables
- Credit expiry is 30 days from issue date (stored in `expiresAt`)
- Add `@@unique([userId, lessonSessionId])` on `Absence` model to prevent duplicate absences at the DB level (defence-in-depth with application-layer check)
- Index on `userId` and `lessonSessionId` for query performance
- DB default `status: APPROVED` matches PRD; application layer must always explicitly set the correct status based on `classifyAbsence()` output — never rely on DB default

**Definition of Done:**
- [ ] `AbsenceType` and `AbsenceStatus` enums exist in schema
- [ ] `Absence` model with all fields from PRD exists
- [ ] `ReplacementCredit` model with all fields from PRD exists
- [ ] `User` model has `absences` and `replacementCredits` relations
- [ ] `LessonSession` model has `absences` relation
- [ ] `Absence` model has `@@unique([userId, lessonSessionId])` constraint
- [ ] Migration runs without errors: `npx prisma migrate dev --name add-absence-system`
- [ ] `npx prisma generate` succeeds
- [ ] `npm run build` passes (no type errors from schema change)

**Verify:**
- `npx prisma migrate dev --name add-absence-system` — migration applies cleanly
- `npx prisma generate` — client regenerates
- `npm run build` — build passes with new schema

---

### Task 2: Validation Helpers & Absence Classification Logic

**Objective:** Create the absence classification function that determines `AbsenceType` based on days between application date and lesson date, and add any needed validation helpers.

**Dependencies:** Task 1

**Files:**
- Create: `lib/absence.ts`
- Modify: `lib/validation.ts` (add `validateAbsenceType()` helper)
- Create: `__tests__/absence.test.ts`

**Key Decisions / Notes:**
- Pure function `classifyAbsence(appliedAt: Date, lessonDate: Date): AbsenceType` — no DB access, easily testable
- Uses calendar days (not hours) difference in Malaysia timezone (UTC+8). **Must use `lib/malaysia-time.ts` pattern**: convert both dates to YYYY-MM-DD strings in MYT timezone, then compute integer day difference. Do NOT use naive UTC subtraction (fails at midnight MYT boundary).
- ≥7 days → `APPLY`, 3–6 days → `LATE_NOTICE`, <3 days → `ABSENT`
- `MEDICAL` type is set manually by the student via a flag in the request, not auto-classified
- Also create `getAbsenceStatus(type: AbsenceType): AbsenceStatus` helper
- Also create `createReplacementCreditExpiry(fromDate: Date): Date` — returns date 30 days from now
- Add `validateAbsenceType(input: string): AbsenceType | null` to `lib/validation.ts` — validates string input against AbsenceType enum values (as required by PRD's "New Validation Helpers Needed" section)
- `sanitiseText` already exists in `lib/validation.ts:141` — reuse for reason/adminNotes fields

**Definition of Done:**
- [ ] `classifyAbsence()` returns correct type for each date range boundary
- [ ] `getAbsenceStatus()` maps types to correct initial statuses
- [ ] `createReplacementCreditExpiry()` returns date 30 days from input
- [ ] `validateAbsenceType()` returns correct AbsenceType for valid inputs (APPLY, LATE_NOTICE, ABSENT, MEDICAL) and null for invalid strings
- [ ] Unit tests cover: exact boundary (7 days = APPLY, 6 days = LATE_NOTICE, 3 days = LATE_NOTICE, 2 days = ABSENT)
- [ ] Unit tests cover: same-day absence, next-day absence, 30-day-out absence
- [ ] All tests pass: `npx vitest run __tests__/absence.test.ts`

**Verify:**
- `npx vitest run __tests__/absence.test.ts` — all tests pass

---

### Task 3: Student-Facing API Routes

**Objective:** Implement 3 API routes for students: submit an absence, list their absences, and list their unused replacement credits.

**Dependencies:** Task 1, Task 2

**Files:**
- Create: `app/api/absences/route.ts` (POST + GET)
- Create: `app/api/absences/credits/route.ts` (GET)
- Create: `__tests__/api/absences.test.ts`

**Key Decisions / Notes:**
- **POST `/api/absences`**: Auth required. Body: `{ lessonSessionId, reason?, isMedical?, proofUrl? }`. System auto-classifies type using `classifyAbsence()`. If `isMedical=true`, override type to `MEDICAL` and status to `PENDING_REVIEW`. If type is `APPLY`, also create `ReplacementCredit` with 30-day expiry. Use `prisma.$transaction` for atomic creation of absence + credit. Validate that the user is actually enrolled in the lesson session. Validate lesson is in the future by checking `lessonSession.lessonDate > now()` from DB — do NOT use `validateFutureDate()` (has 90-day max limit that would reject distant lessons). Prevent duplicate absences for same user+session (application check + DB `@@unique` constraint). Catch Prisma P2002 unique constraint error and return 409.
- **GET `/api/absences`**: Auth required. Returns user's absences ordered by `lessonDate desc`. Include lessonSession details (date, time, court).
- **GET `/api/absences/credits`**: Auth required. Returns user's unused replacement credits (`usedAt IS NULL` and `expiresAt > now()`). Include related absence info.
- **PATCH `/api/absences`**: Auth required. Body: `{ absenceId, proofUrl }`. Allows student to update proofUrl on their own PENDING_REVIEW absence (for re-uploading MC proof after initial submission). Only allows updating proofUrl, not other fields.
- Follow auth pattern from `app/api/profile/lessons/route.ts:5-11`
- Error format: `{ error: 'message' }` with appropriate status codes

**Definition of Done:**
- [ ] POST creates absence with correct auto-classified type
- [ ] POST creates ReplacementCredit atomically when type is APPLY
- [ ] POST validates user is enrolled in the lesson session
- [ ] POST validates lesson is in the future
- [ ] POST prevents duplicate absence for same user+session
- [ ] POST handles MEDICAL type with proofUrl
- [ ] GET `/api/absences` returns user's absences with lesson details
- [ ] GET `/api/absences/credits` returns only unused, non-expired credits
- [ ] POST handler always explicitly sets AbsenceStatus based on type, never relying on DB default
- [ ] All endpoints return 401 for unauthenticated requests
- [ ] Tests cover: POST with ≥7 days creates absence + credit atomically; POST with 3-6 days creates absence only; POST with <3 days creates absence only; POST with isMedical=true sets PENDING_REVIEW; POST for non-enrolled user returns 400; POST for past lesson returns 400; POST duplicate returns 409; GET returns only caller's absences; GET /credits returns only unused non-expired credits; all endpoints return 401 when unauthenticated

**Verify:**
- `npx vitest run __tests__/api/absences.test.ts` — all tests pass

---

### Task 4: Admin API Routes

**Objective:** Implement 2 admin API routes: list all absences with filters, and review a medical absence.

**Dependencies:** Task 1, Task 2

**Files:**
- Create: `app/api/admin/absences/route.ts` (GET)
- Create: `app/api/admin/absences/[id]/review/route.ts` (PATCH)
- Create: `__tests__/api/admin-absences.test.ts`

**Key Decisions / Notes:**
- **GET `/api/admin/absences`**: Admin auth required. Query params: `type` (AbsenceType filter), `status` (AbsenceStatus filter), `userId` (specific student), `dateStart`/`dateEnd` (lesson date range). Include user name/phone and lesson details. Order by `appliedAt desc`.
- **PATCH `/api/admin/absences/[id]/review`**: Admin auth required. Body: `{ creditAwarded: boolean, adminNotes?: string }`. Only works on absences with status `PENDING_REVIEW`. Use `prisma.$transaction` to atomically: check status via `updateMany({ where: { id, status: 'PENDING_REVIEW' }, data: { status: 'REVIEWED', ... } })` and verify count > 0 (if 0, already reviewed → return 409). If `creditAwarded=true`, create `ReplacementCredit` inside the transaction. Catch P2002 on ReplacementCredit's `@@unique absenceId` and return 409. After transaction, create notification for the student.
- Use `validateAbsenceType()` from `lib/validation.ts` to validate the `type` query param in the GET endpoint
- Follow admin auth pattern from `app/api/admin/lessons/route.ts:13-19`

**Definition of Done:**
- [ ] GET returns absences with all filter combinations working
- [ ] GET includes user info (name, phone) and lesson session details
- [ ] PATCH only works on PENDING_REVIEW absences (returns 400 otherwise)
- [ ] PATCH updates status to REVIEWED with reviewer info
- [ ] PATCH creates ReplacementCredit when creditAwarded=true
- [ ] PATCH creates notification for the student
- [ ] Both endpoints return 401/403 for non-admin requests
- [ ] Tests cover: GET returns absences filtered by type, status, userId, dateStart/dateEnd independently; PATCH on PENDING_REVIEW absence updates to REVIEWED and creates notification; PATCH with creditAwarded=true creates ReplacementCredit; PATCH on non-PENDING_REVIEW absence returns 400; both endpoints return 401/403 for non-admin requests

**Verify:**
- `npx vitest run __tests__/api/admin-absences.test.ts` — all tests pass

---

### Task 5: Student UI — Absences Tab in Profile

**Objective:** Add an "Absences" tab to the profile page that shows upcoming lessons with apply/notify buttons, absence history with month-grid calendar view, and replacement credit count.

**Dependencies:** Task 3, Task 8 (for medical proof upload UI wired to `/api/upload/absence-proof`)

**Files:**
- Create: `components/profile/AbsencesTab.tsx`
- Modify: `app/profile/page.tsx` (extend `TabType` union, add tab to array, add render conditional)
- Modify: `app/api/profile/lessons/route.ts` (add `?upcoming=true` query param filter)

**Key Decisions / Notes:**
- Show tab only for members (same condition as Lessons tab: `profile?.isMember`)
- **TypeScript change:** Extend `TabType` union in `app/profile/page.tsx` to include `'absences'` (line 27: `type TabType = 'personal' | 'bookings' | 'recurring' | 'lessons' | 'absences' | 'settings'`). Add `activeTab === 'absences'` conditional render block in the tab content section.
- Tab icon: `CalendarX2` from lucide-react
- **Section 1: Replacement Credits badge** — show count of available credits at top
- **Section 2: Upcoming Lessons** — fetch from `/api/profile/lessons?upcoming=true` (add `upcoming` query param support to the existing route to filter server-side: `where: { lessonDate: { gte: now } }`). This avoids fetching the full lesson history just to filter client-side. Each row: date, time, court, lesson type. Button: "Apply Absence" (green, if ≥7 days away) or "Notify Absence" (yellow/muted, if <7 days). Click opens confirmation dialog with optional reason field. For medical: checkbox to mark as medical + file upload for MC proof.
- **Section 3: Calendar View** — month-grid calendar (reuse existing `Calendar` component from `@/components/ui/calendar`) showing absence dates with color-coded dots (APPLY=green, LATE_NOTICE=yellow, ABSENT=red, MEDICAL=blue). Clicking a date shows that day's absence details. Also shows replacement credit expiry dates as indicators.
- **Section 4: Absence History** — fetch from `/api/absences`. List showing: lesson date, type badge (color-coded: APPLY=green, LATE_NOTICE=yellow, ABSENT=red, MEDICAL=blue), status badge, reason if present, credit awarded indicator.
- Use existing UI components: `Card`, `Badge`, `Button`, `Dialog`, `Input`
- Follow data fetching pattern from `components/profile/LessonsTab.tsx`
- Dark mode: use only theme-aware classes (`bg-card`, `text-foreground`, `border-border`, etc.)
- Use `useTranslations('absence')` for all strings

**Definition of Done:**
- [ ] Absences tab appears in profile for members only
- [ ] Upcoming lessons list shows with correct apply/notify button labels
- [ ] Apply/notify dialog submits absence correctly to POST `/api/absences`
- [ ] Medical absence option with file upload wired to `/api/upload/absence-proof` (Task 8), NOT `/api/upload/receipt`
- [ ] Calendar view shows absence dates with color-coded dots by type
- [ ] Absence history list displays with type and status badges
- [ ] Replacement credits count displayed
- [ ] Loading and error states handled
- [ ] All text uses i18n translations
- [ ] Dark mode renders correctly (no hardcoded colors)

**Verify:**
- `npm run build` — build passes with no type errors
- Manual: open profile page as a member, verify Absences tab renders

---

### Task 6: Admin UI — Absences Dashboard Page

**Objective:** Create the `/admin/absences` page with a pending review queue, filterable absences table, and review action for medical absences.

**Dependencies:** Task 4

**Files:**
- Create: `app/admin/absences/page.tsx`
- Create: `components/admin/AbsencesContent.tsx`
- Modify: `app/admin/page.tsx` (add absences card to admin dashboard)

**Key Decisions / Notes:**
- Page layout follows existing admin pattern: back button, title, description header
- Add new card to admin dashboard (`app/admin/page.tsx`) with `CalendarX2` icon linking to `/admin/absences`
- **Section 1: Pending Reviews** — filtered list of MEDICAL/PENDING_REVIEW absences at top. Each card: student name, lesson date, reason, proof image link, approve/deny buttons.
- **Section 2: All Absences Table** — full list with filters. Filters: type dropdown (all/APPLY/LATE_NOTICE/ABSENT/MEDICAL), status dropdown (all/APPROVED/RECORDED/PENDING_REVIEW/REVIEWED), date range picker (optional — can use month selector like lessons page). Table columns: Student, Lesson Date, Type (badge), Status (badge), Reason, Credit, Applied At.
- **Section 3: Quick Stats** — cards at top showing: total absences this month, pending reviews count, credits awarded this month, most common absence type (count breakdown by AbsenceType). Below stats cards: absence rate per student table — sortable list showing each student's absence count for the current month, derived from the fetched absences data.
- Review dialog: opens on click, shows details + admin notes textarea + approve/deny credit buttons
- Follow dynamic import pattern from `app/admin/bookings-lessons/page.tsx:13-27`
- **i18n distinction:** `app/admin/page.tsx` is a SERVER component — use `getTranslations('admin')` from `next-intl/server` when adding the dashboard card. `app/admin/absences/page.tsx` and `components/admin/AbsencesContent.tsx` are CLIENT components — use `useTranslations('absence')`.
- Admin auth check: `useSession` + `isAdmin` pattern from `app/admin/bookings-lessons/page.tsx:32-45` for the client absences page; `auth()` + `isAdmin()` for the server admin page

**Definition of Done:**
- [ ] Admin dashboard has new "Absences" card linking to `/admin/absences`
- [ ] Pending review queue shows MEDICAL absences needing review
- [ ] After submitting review dialog, reviewed absence is removed from Pending Reviews section; absence in All Absences table shows status badge REVIEWED; success toast is displayed; page does not require full reload
- [ ] Absences table displays with type and status filter dropdowns
- [ ] Stats cards show: total absences this month, pending reviews count, credits awarded this month, most common type breakdown
- [ ] Absence rate per student table displays sortable student absence counts
- [ ] Admin-only access enforced
- [ ] All text uses i18n translations
- [ ] Dark mode renders correctly

**Verify:**
- `npm run build` — build passes
- Manual: open `/admin/absences` page as admin, verify pending queue and table render

---

### Task 7: i18n Translations (EN/ZH/MS)

**Objective:** Add the `absence` namespace translations to all three locale files.

**Dependencies:** Task 5, Task 6 (needs to know all UI strings)

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh.json`
- Modify: `messages/ms.json`

**Key Decisions / Notes:**
- Add `"absence"` namespace with keys for: tab label, page titles, button labels (apply/notify), type labels, status labels, dialog text, empty states, credit-related strings, admin strings (pending review, approve, deny, stats), error messages
- Also add admin dashboard card translations under existing `admin` namespace
- Follow existing structure: nested objects, descriptive key names
- ZH translations: use simplified Chinese appropriate for Malaysian Chinese audience
- MS translations: use standard Bahasa Melayu

**Definition of Done:**
- [ ] `messages/en.json` has complete `absence` namespace
- [ ] `messages/zh.json` has complete `absence` namespace with correct Chinese translations
- [ ] `messages/ms.json` has complete `absence` namespace with correct Malay translations
- [ ] Admin dashboard card strings added to `admin` namespace in all 3 files
- [ ] `npm run build` passes (no missing translation keys at build time)

**Verify:**
- `npm run build` — build passes
- Manual: switch language in UI, verify absence strings display correctly

---

### Task 8: Upload Route for MC Proof & Notifications

**Objective:** Create a dedicated upload route for medical certificate proof images, add notification creation to the absence submission and review flows, and implement replacement credit expiry warning notifications.

**Dependencies:** Task 3, Task 4

**Files:**
- Create: `app/api/upload/absence-proof/route.ts`
- Create: `app/api/cron/credit-expiry/route.ts`
- Modify: `app/api/absences/route.ts` (add notification on submission)
- Modify: `app/api/admin/absences/[id]/review/route.ts` (add notification on review)
- Modify: `lib/absence.ts` (add `checkExpiringCredits()` function)

**Key Decisions / Notes:**
- Upload route uses Vercel Blob pattern from `app/api/upload/receipt/route.ts` for file handling (5MB limit, image types only). **WARNING:** The receipt route has NO auth check (designed for guest uploads) and returns `{ message: '...' }` on errors. The absence-proof route MUST: (1) add `auth()` check and return 401 for unauthenticated requests, (2) use `{ error: '...' }` format per API conventions. Do NOT blindly copy the receipt route.
- File path prefix: `absence-proofs/` instead of `receipts/`
- **Notifications on absence submission:** Confirmation notification to student — "Your absence for [date] has been recorded as [type]"
- **Notifications on medical review:** Outcome notification — "Your medical absence for [date] has been reviewed. Credit [awarded/not awarded]."
- Notification type strings: `absence_submitted`, `absence_reviewed`, `credit_expiring`
- **Credit expiry warning:** Create a utility function `checkExpiringCredits()` in `lib/absence.ts` that finds credits expiring in 3 days and creates notifications. This can be called from an existing cron route or a new one at `/api/cron/credit-expiry`. The cron simply calls the utility function. Notification: "Your replacement credit (from [date] absence) expires in 3 days."
- Follow notification pattern from `lib/booking-expiration.ts:119-128`

**Definition of Done:**
- [ ] Upload route accepts image files and stores in Vercel Blob under `absence-proofs/` prefix
- [ ] Upload route requires authentication
- [ ] Absence submission creates confirmation notification
- [ ] Medical review creates outcome notification
- [ ] Notification links point to profile absences tab (`/profile?tab=absences`)
- [ ] Credit expiry cron route finds credits expiring in 3 days and creates notifications
- [ ] `checkExpiringCredits()` utility function is unit-testable
- [ ] Tests cover upload validation, notification creation, and credit expiry check

**Verify:**
- `npx vitest run __tests__/api/absences.test.ts` — tests pass including notification assertions
- `npm run build` — build passes

## Testing Strategy

- **Unit tests:** `lib/absence.ts` — classification logic boundary testing (Task 2)
- **API route tests:** All 5 routes tested with mocked Prisma and auth (Tasks 3, 4, 8)
  - Pattern: `vi.mock('@/lib/auth')`, `vi.mock('@/lib/prisma')`, use fixtures from `__tests__/helpers/api-helpers.ts`
- **Build verification:** `npm run build` after each UI task to catch type errors
- **Manual verification:** E2E flow using `playwright-cli` after all tasks complete — submit absence as student, review as admin

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Timezone mismatch in date classification | Medium | High | Use existing `lib/malaysia-time.ts` pattern: convert both dates to YYYY-MM-DD strings in MYT timezone before computing day difference. Unit tests cover midnight boundary (11:59 PM MYT = different day in UTC). |
| Student not enrolled in lesson session | Low | Medium | POST `/api/absences` validates enrollment by checking `lessonSession.students.some(s => s.id === userId)` before creating absence |
| Duplicate absence submission | Medium | Medium | DB-level `@@unique([userId, lessonSessionId])` constraint as primary guard. Application-level check before insert for user-friendly 409 response. Catch Prisma P2002 as safety net for concurrent requests. |
| Large absence table slows admin page | Low | Low | Paginate admin GET endpoint (default 50 per page). Add DB indexes on `userId`, `lessonSessionId`, `type`, `status`. |
| MC proof upload fails | Low | Low | Upload is optional at submission time. PATCH `/api/absences` allows student to update proofUrl on their own PENDING_REVIEW absence for re-uploading MC proof after initial submission. UI shows clear error message on failure. |

## Open Questions

- None — PRD is comprehensive and all design decisions are clear from the specification.

### Deferred Ideas

- Advanced absence analytics with charts/visualizations (beyond the per-student count table)
- Email notifications (supplement in-app notifications)
- Bulk absence management for admin (e.g., mark whole class as absent for cancelled session)
