# Fix Remaining Assessment Issues Implementation Plan

Created: 2026-02-16
Status: PENDING
Approved: No
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

**Goal:** Fix the 3 remaining unfixed issues from the critical assessment (open redirect, booking page decomposition, hardcoded i18n strings) plus a regression bug from a recent commit (`sports` → `sportsNames` key rename).

**Architecture:** Extract the 1,442-line booking page into ~6 focused components under `components/booking/`. Unify the nearly-identical TNG and DuitNow payment modals into a single configurable `PaymentModal`. Add missing i18n translation keys for all hardcoded English strings in the payment flow. Fix the middleware callback URL validation for defense in depth.

**Tech Stack:** Next.js App Router, React, next-intl, Tailwind CSS

## Scope

### In Scope

- Validate callback URL in middleware (open redirect fix)
- Decompose `app/booking/page.tsx` (1,442 lines → multiple files each under 300 lines)
- Unify TNG/DuitNow payment modals into single `PaymentModal` component (DRY)
- Add i18n keys for all hardcoded English strings in booking payment flow
- Fix `tHome('sports.X')` → `tHome('sportsNames.X')` references (regression from commit `cf6c241`)

### Out of Scope

- Max booking date (already fixed: calendar disables >90 days, `validateFutureDate` enforces server-side)
- Other assessment issues already addressed by prior commits
- Admin-only hardcoded strings (low user impact)
- Layout metadata strings (SEO-focused, not user-facing UI)

## Prerequisites

- None. All dependencies are already installed.

## Context for Implementer

- **Patterns to follow:** Component files in `components/home/` demonstrate the extraction pattern. Each section of the homepage is its own component (e.g., `HeroSection.tsx`, `AboutSection.tsx`). Follow the same pattern for booking sub-components.
- **Conventions:** All components use `'use client'` directive. Translations use `useTranslations('namespace')` from `next-intl`. Tailwind theme classes (`bg-card`, `text-foreground`, etc.) are mandatory — never hardcode hex colors.
- **Key files:**
  - `app/booking/page.tsx` — the 1,442-line file being decomposed
  - `messages/en.json`, `messages/ms.json`, `messages/zh.json` — i18n translation files
  - `middleware.ts` — callback URL validation
  - `components/TermsModal.tsx` — example of a modal component pattern
- **Gotchas:**
  - The TNG and DuitNow modals (lines 1027-1224 and 1230-1427) are 95% identical. They share the same structure but differ in: QR image path, payment method label, step 2 text ("Open TnG App" vs "Open Your Banking App"), and state variables.
  - The `home.sports` key in messages still contains SportsSection content (badge, title, etc.). Only the `badminton`/`pickleball` name keys were moved to `home.sportsNames`. The booking page references `tHome('sports.badminton')` which is now broken.
  - The booking page uses `tHome = useTranslations('home')` to access home namespace translations alongside `t = useTranslations('booking')`.
- **Domain context:** Malaysian payment flow: users save a QR code, open their banking/eWallet app, scan the QR from gallery, enter the amount, complete payment, then upload a receipt screenshot for manual admin verification.

## Runtime Environment

- **Start command:** `npm run dev`
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [ ] Task 1: Fix callback URL validation in middleware
- [ ] Task 2: Extract booking types, constants, and utilities
- [ ] Task 3: Add missing i18n keys for booking payment flow
- [ ] Task 4: Create unified PaymentModal component
- [ ] Task 5: Extract BookingSummary component
- [ ] Task 6: Extract TimeSlotGrid component
- [ ] Task 7: Refactor main booking page to wire components together

**Total Tasks:** 7 | **Completed:** 0 | **Remaining:** 7

## Implementation Tasks

### Task 1: Fix Callback URL Validation in Middleware

**Objective:** Validate that the `callbackUrl` set in middleware is a safe relative path, preventing open redirect attacks. While `pathname` from `nextUrl` is already relative, explicit validation provides defense in depth and matches the client-side validation already in `app/auth/login/page.tsx:19`.

**Dependencies:** None

**Files:**

- Modify: `middleware.ts`
- Test: `__tests__/middleware.test.ts`

**Key Decisions / Notes:**

- Validate that `pathname` starts with `/` and does not start with `//` (protocol-relative URL)
- Validate it doesn't contain `://` anywhere (absolute URL embedded in path)
- Fall back to `/` if validation fails
- Matches the existing client-side validation pattern at `app/auth/login/page.tsx:19`

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Middleware validates callbackUrl starts with `/` and not `//`
- [ ] Invalid paths fall back to `/`

**Verify:**

- `npm test` — middleware tests pass

### Task 2: Extract Booking Types, Constants, and Utilities

**Objective:** Move interfaces, type definitions, rate constants, and pure utility functions out of the booking page into reusable modules.

**Dependencies:** None

**Files:**

- Create: `components/booking/types.ts`
- Create: `components/booking/utils.ts`
- Test: `__tests__/booking-utils.test.ts`

**Key Decisions / Notes:**

- `types.ts` contains: `Court`, `TimeSlot`, `SlotAvailability`, `CourtAvailability`, `SelectedSlot`, `Sport` type, and rate constants (`BADMINTON_RATE_PER_SLOT`, etc.)
- `utils.ts` contains pure functions: `formatTimeRange()`, `getSlotRate()`, `getMinSlots()`
- These are used by multiple booking sub-components (TimeSlotGrid, BookingSummary, PaymentModal, and the main page)

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Types and constants exported from `components/booking/types.ts`
- [ ] Utility functions exported from `components/booking/utils.ts` with unit tests
- [ ] `formatTimeRange` correctly calculates 30-min ranges including AM/PM transitions

**Verify:**

- `npm test` — booking-utils tests pass

### Task 3: Add Missing i18n Keys for Booking Payment Flow

**Objective:** Add translation keys for all hardcoded English strings in the booking payment modals and booking UI to all three message files (en, ms, zh).

**Dependencies:** None

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/ms.json`
- Modify: `messages/zh.json`

**Key Decisions / Notes:**

- Add keys under `booking.payment` namespace for payment modal strings: `payWith`, `amountToPay`, `saveQrCode`, `saveQrToGallery`, `tapToSaveQr`, `openTngApp`, `openTngAppDesc`, `openBankApp`, `openBankAppDesc`, `scanFromGallery`, `scanFromGalleryTngDesc`, `scanFromGalleryDuitNowDesc`, `enterAmount`, `enterAmountDesc`, `completePayment`, `completePaymentDesc`, `iHavePaid`, `onlyAfterPaid`, `confirmMyBooking`, `creatingBooking`, `bookingCreated`, `pendingVerification`, `submitForVerification`, `done`
- Add keys for booking page pricing: `booking.pricing.badmintonRate`, `booking.pricing.pickleballRate`, `booking.pricing.minBadminton`, `booking.pricing.minPickleball`
- Add keys for booking time header: `booking.timeHeader`
- Fix `booking.pricing` format to be translatable (e.g., "RM15/hr before 6PM" is locale-specific)
- For MS and ZH: provide actual translations, not just English duplicates

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] All hardcoded English strings from payment modals have translation keys
- [ ] All 3 message files (en, ms, zh) have the new keys with proper translations
- [ ] No `|| 'English fallback'` patterns remain in booking components

**Verify:**

- `npm run lint` — no errors
- Manual check: new keys exist in all 3 message files

### Task 4: Create Unified PaymentModal Component

**Objective:** Extract and unify the TNG and DuitNow payment modals (currently ~200 lines each, 95% identical) into a single configurable `PaymentModal` component.

**Dependencies:** Task 2, Task 3

**Files:**

- Create: `components/booking/PaymentModal.tsx`
- Test: `__tests__/payment-modal.test.tsx`

**Key Decisions / Notes:**

- Props: `paymentMethod: 'tng' | 'duitnow'`, `open`, `onOpenChange`, `total`, `selectedSlots`, `onConfirm`, `booking`, booking-related callbacks
- Internal state for: hasPaid toggle, receipt file/preview, booking created success state
- Payment method config object maps method to: QR image path, step 2 title/description, method-specific instructions
- Uses translation keys from Task 3 (`t('payment.payWith')`, etc.)
- Receipt upload/remove logic moves into this component
- QR download logic moves into this component
- Follow `components/TermsModal.tsx` as a pattern for Dialog-based modals

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Single component renders both TNG and DuitNow modals based on `paymentMethod` prop
- [ ] Receipt upload, QR download, "I have paid" toggle all work within the component
- [ ] All user-visible strings use translation keys (no hardcoded English)
- [ ] File is under 300 lines

**Verify:**

- `npm test` — payment-modal tests pass

### Task 5: Extract BookingSummary Component

**Objective:** Extract the booking summary sidebar (selected slots list, total, guest form, terms checkbox, payment buttons) into its own component.

**Dependencies:** Task 2

**Files:**

- Create: `components/booking/BookingSummary.tsx`
- Test: `__tests__/booking-summary.test.ts`

**Key Decisions / Notes:**

- Props: `selectedSlots`, `total`, `sport`, `selectedDate`, `session`, `termsAgreed`, `onTermsChange`, `onPayment`, `booking` state, `userIsAdmin`, `onTestBooking`
- Contains: slot list display, total amount, guest form (name/phone/email), terms checkbox, TNG/DuitNow/test booking buttons
- Guest form state stays in main page (lifted up) since it's used by payment handlers
- Uses `formatTimeRange` from `components/booking/utils.ts`
- Pricing info strings use i18n keys from Task 3

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Summary card renders correctly with selected slots
- [ ] Guest form shows when not logged in
- [ ] Payment buttons trigger callbacks
- [ ] All user-visible strings use translation keys
- [ ] File is under 300 lines

**Verify:**

- `npm test` — booking-summary tests pass

### Task 6: Extract TimeSlotGrid Component

**Objective:** Extract the time slot availability grid (table with courts as columns, time slots as rows) into its own component.

**Dependencies:** Task 2

**Files:**

- Create: `components/booking/TimeSlotGrid.tsx`
- Test: `__tests__/timeslot-grid.test.ts`

**Key Decisions / Notes:**

- Props: `availability`, `selectedSlots`, `onToggleSlot`, `loading`, `sport`, `selectedDate`
- Contains: the `<table>` with court headers, time rows, slot buttons
- Slot selection logic (`toggleSlot`, `isSlotSelected`, `isAdjacentToSelection`, etc.) stays in the main page since it manages the `selectedSlots` state
- The `isSlotSelected` check is passed down as a callback or computed from `selectedSlots` prop
- Uses `formatTimeRange` from utils
- The "Time" column header needs an i18n key

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Grid renders courts and time slots correctly
- [ ] Selected slots are visually highlighted
- [ ] Unavailable/past slots are disabled
- [ ] Loading state shows loading message
- [ ] File is under 300 lines

**Verify:**

- `npm test` — timeslot-grid tests pass

### Task 7: Refactor Main Booking Page

**Objective:** Wire all extracted components together in the main booking page. Fix the `sports` → `sportsNames` translation key regression. Ensure the page file is under 300 lines.

**Dependencies:** Task 1, Task 2, Task 3, Task 4, Task 5, Task 6

**Files:**

- Modify: `app/booking/page.tsx`

**Key Decisions / Notes:**

- Import and compose: `TimeSlotGrid`, `BookingSummary`, `PaymentModal` (×2 instances for TNG/DuitNow)
- Keep booking state management and slot selection logic in the main page
- Keep API call handlers (`handleTngPayment`, `handleDuitNowPayment`, `handleTestBooking`) in the main page
- Fix all `tHome('sports.X')` → `tHome('sportsNames.X')` references (4 occurrences at lines 675, 685, 759, 853)
- Move sport tabs and pricing banner inline (small enough to keep in main page)
- Target: main page under 300 lines
- Payment modal state (open/close) managed by main page, passed as props

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] `app/booking/page.tsx` is under 300 lines
- [ ] All extracted components render correctly when composed
- [ ] `tHome('sportsNames.badminton')` and `tHome('sportsNames.pickleball')` used (not `sports.X`)
- [ ] No hardcoded English strings remain in any booking component
- [ ] Build succeeds (`npm run build`)

**Verify:**

- `npm test` — all tests pass
- `npm run build` — build succeeds
- `wc -l app/booking/page.tsx` — under 300 lines
- `grep -r "sports\.\(badminton\|pickleball\)" app/booking/` — no matches (old key gone)

## Testing Strategy

- **Unit tests:** `formatTimeRange`, `getSlotRate`, `getMinSlots` utility functions, middleware callback validation
- **Component tests:** PaymentModal renders correctly for both payment methods, BookingSummary shows/hides guest form, TimeSlotGrid highlights selected slots
- **Build verification:** `npm run build` succeeds with no errors
- **Manual verification:** Booking flow works end-to-end in browser

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking booking flow during decomposition | Medium | High | Extract components one at a time, verify build after each. Keep all business logic in main page initially. |
| Missing translation keys in MS/ZH | Low | Medium | Provide actual translations for all 3 languages. Run build to catch missing key references. |
| Payment modal state management issues | Low | Medium | Keep payment modal state (open, hasPaid, receipt) inside PaymentModal component. Only expose callbacks for booking creation. |

## Open Questions

- None. All requirements are clear from the assessment and codebase exploration.
