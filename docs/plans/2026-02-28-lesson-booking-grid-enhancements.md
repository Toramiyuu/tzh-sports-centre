# Lesson & Booking Grid Enhancements Implementation Plan

Created: 2026-02-28
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** Set at plan creation (from dispatcher). `Yes` uses git worktree isolation; `No` works directly on current branch (default)
> **Type:** `Feature` or `Bugfix` — set at planning time, used by dispatcher for routing

## Summary

**Goal:** Enable lesson creation (one-time and recurring) directly from the BookingsContent grid by clicking empty slots, and add drag-to-reschedule capability for both lessons and bookings within the same day.

**Architecture:** Extend the existing BookingsContent grid to add a slot-type chooser when clicking empty cells (Booking / Lesson / Recurring Lesson), create new lesson/booking creation dialogs that open from the grid, and implement HTML5 drag-and-drop on occupied grid cells with a drag handle icon. A new reschedule API endpoint handles the server-side move with conflict detection.

**Tech Stack:** React 19, Next.js 16 App Router, Prisma ORM, Tailwind CSS, Radix UI, next-intl, HTML5 Drag and Drop API

## Scope

### In Scope

- Slot-type chooser popover when clicking empty grid cells (Booking / Lesson / Recurring Lesson)
- One-time lesson creation dialog from grid (reuses existing `/api/admin/lessons` POST)
- Recurring lesson creation dialog from grid (reuses existing `/api/admin/recurring-lessons` POST)
- Drag handle icon on occupied cells (bookings + lessons) on hover
- Drag-to-reschedule within the same day (different court or time slot)
- Confirmation dialog showing old → new slot before committing
- New reschedule API endpoints for bookings and lessons with conflict detection
- Recurring lesson instances move individually (only the LessonSession, not the RecurringLesson definition)
- i18n keys in all 3 languages (en, ms, zh)

### Out of Scope

- Cross-day rescheduling (drag is same-day only)
- Drag for recurring booking definitions (only individual booking instances)
- Mobile touch-based drag (HTML5 drag doesn't work well on mobile; grid is desktop admin tool)
- Undo/redo for moves

## Prerequisites

- Existing BookingsContent grid component (`components/admin/BookingsContent.tsx`)
- Existing lesson creation API (`app/api/admin/lessons/route.ts`)
- Existing recurring lesson creation API (`app/api/admin/recurring-lessons/route.ts`)
- Existing booking creation API (`app/api/admin/bookings/route.ts`)
- `useLessonTypes` hook (`lib/hooks/useLessonTypes.ts`)

## Context for Implementer

- **Patterns to follow:** The grid rendering is in `components/admin/BookingsContent.tsx:1130-1440`. Each cell is a `<td>` that checks `bookingMap[courtId-slotTime]`. Empty cells render a `<Button>` with a `+` icon. Occupied cells render booking/lesson info.
- **Conventions:** All admin API routes use `isAdmin()` check from `lib/admin.ts`. State is managed with `useState` hooks. Translations use `useTranslations("admin.bookings")` namespace.
- **Key files:**
  - `components/admin/BookingsContent.tsx` — Main grid component (3357 lines)
  - `components/admin/MultiSlotDialog.tsx` — Existing multi-slot creation dialog (reuse pattern for lesson dialog)
  - `app/api/admin/bookings/route.ts` — Booking API (bookingMap construction at lines 79-171)
  - `app/api/admin/lessons/route.ts` — Lesson CRUD with conflict detection
  - `app/api/admin/recurring-lessons/route.ts` — Recurring lesson CRUD
  - `lib/hooks/useLessonTypes.ts` — Hook for lesson type data and pricing
  - `components/admin/CreateRecurringLessonDialog.tsx` — Existing recurring lesson dialog (reuse pattern)
- **Gotchas:**
  - BookingsContent.tsx is already 3357 lines. New dialogs MUST be in separate component files.
  - The bookingMap is keyed as `courtId-slotTime`. Lessons occupy multiple consecutive slots (based on duration). When dragging a lesson, ALL its slots must be considered.
  - Recurring bookings in the grid have `isRecurring: true` — these should NOT be draggable (only individual booking instances).
  - The lesson PATCH endpoint currently only supports status/notes/teacherId updates — NOT rescheduling. A new endpoint is needed.
  - Booking PATCH endpoint only supports approve/reject — NOT rescheduling. A new endpoint is needed.
- **Domain context:** The grid shows a single day's bookings across all courts. Time slots are 30-min intervals. Bookings and lessons can span multiple slots. Conflict detection must check bookings, recurring bookings, and lesson sessions.
- **Data sourcing for dialogs:** Teachers come from `/api/admin/staff` (returns `{ teachers: [{id, name}] }`). Students/trainees come from `/api/admin/members` (returns `{ members: [{id, name, uid, ...}] }`). These are the same endpoints used by `LessonsContent.tsx:294-299`. Do NOT use `/api/admin/teachers` or `/api/admin/trainees` — those routes do not exist.
- **Lesson cell CSS for drag:** Existing lesson cells (`BookingsContent.tsx:1166-1186`) render as a plain `<div>` without `relative` or `group` classes. Task 5 must add these classes to lesson cells (same as booking cells) for the drag handle positioning.

## Runtime Environment

- **Start command:** `npm run dev`
- **Port:** 3000
- **Admin grid URL:** `http://localhost:3000/admin` → navigate to Bookings tab
- **Health check:** Visit `http://localhost:3000` in browser
- **Restart procedure:** Stop dev server (Ctrl+C), re-run `npm run dev`
- **Prerequisites:** `DATABASE_URL` and `NEXTAUTH_SECRET` set in `.env.local`

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Slot type chooser popover on empty cells
- [x] Task 2: One-time lesson creation dialog from grid
- [x] Task 3: Recurring lesson creation dialog from grid
- [x] Task 4: Reschedule API endpoints for bookings and lessons
- [x] Task 5: Drag-to-reschedule UI on the grid
- [x] Task 6: i18n translations for all new UI

**Total Tasks:** 6 | **Completed:** 6 | **Remaining:** 0

## Implementation Tasks

### Task 1: Slot Type Chooser Popover on Empty Cells

**Objective:** Replace the current empty cell behavior (direct booking dialog) with a popover that lets the admin choose: "Booking", "Lesson", or "Recurring Lesson".

**Dependencies:** None

**Files:**

- Create: `components/admin/SlotTypeChooser.tsx`
- Modify: `components/admin/BookingsContent.tsx`

**Key Decisions / Notes:**

- Use Radix UI `Popover` component (already available in `components/ui/popover.tsx`)
- The popover appears anchored to the clicked empty cell
- Three options: Booking (existing flow), Lesson (Task 2), Recurring Lesson (Task 3)
- Choosing "Booking" opens the existing `addDialogOpen` dialog (no change to current flow)
- Choosing "Lesson" opens a new lesson creation dialog (Task 2)
- Choosing "Recurring Lesson" opens a new recurring lesson creation dialog (Task 3)
- In selection mode, empty cells still toggle free slot selection (no popover)
- The component should accept the `courtId`, `slotTime`, and callbacks as props

**Definition of Done:**

- [ ] Clicking empty grid cell shows popover with 3 options
- [ ] Selecting "Booking" opens existing add booking dialog with correct court/slot
- [ ] Selecting "Lesson" triggers lesson dialog callback (wired in Task 2)
- [ ] Selecting "Recurring Lesson" triggers recurring lesson dialog callback (wired in Task 3)
- [ ] Popover closes on selection or click outside
- [ ] Selection mode still works (free slot toggle, no popover)
- [ ] `npm run build` passes

**Verify:**

- `npm run build` — zero errors

### Task 2: One-Time Lesson Creation Dialog from Grid

**Objective:** Create a dialog for one-time lesson creation that opens when "Lesson" is chosen from the slot type chooser. Pre-fills court and date from the selected slot.

**Dependencies:** Task 1

**Files:**

- Create: `components/admin/GridLessonDialog.tsx`
- Modify: `components/admin/BookingsContent.tsx`

**Key Decisions / Notes:**

- Follow the pattern from `MultiSlotDialog.tsx` for lesson creation (fetches lesson types, teachers, trainees)
- Use `useLessonTypes` hook for lesson type data and duration options
- Pre-fill: courtId from selected slot, lessonDate from selectedDate, startTime from slotTime
- Fields: lesson type (dropdown), duration (from pricing tiers), teacher (optional dropdown), students (multi-select from trainees), notes (optional textarea)
- On submit: POST to `/api/admin/lessons` (existing endpoint — no API changes needed)
- After success: close dialog, refresh bookings grid via `fetchBookings()`
- Fetch teachers from `/api/admin/staff` (returns `{ teachers: [...] }`), students/trainees from `/api/admin/members` (returns `{ members: [...] }`) — these are the existing endpoints used by `LessonsContent.tsx:294-299`

**Definition of Done:**

- [ ] Dialog opens with pre-filled court and time from selected grid slot
- [ ] Lesson type dropdown shows active lesson types
- [ ] Duration options update based on selected lesson type
- [ ] Teacher dropdown shows active teachers (optional selection)
- [ ] Student multi-select shows trainees with max student limit enforcement
- [ ] Creating a lesson via dialog adds it to the grid on refresh
- [ ] When lesson creation API returns 409 (slot conflict), an error toast shows the API error message and the dialog stays open
- [ ] `npm run build` passes

**Verify:**

- `npm run build` — zero errors
- `npm run dev` — navigate to admin bookings grid, click empty slot, select Lesson, verify dialog opens with pre-filled data

### Task 3: Recurring Lesson Creation Dialog from Grid

**Objective:** Create a dialog for recurring lesson creation that opens when "Recurring Lesson" is chosen from the slot type chooser. Pre-fills court and day-of-week from the selected slot/date.

**Dependencies:** Task 1

**Files:**

- Create: `components/admin/GridRecurringLessonDialog.tsx`
- Modify: `components/admin/BookingsContent.tsx`

**Key Decisions / Notes:**

- Follow the pattern from `CreateRecurringLessonDialog.tsx`
- Use `useLessonTypes` hook for lesson type data and duration options
- Fetch teachers from `/api/admin/staff`, students from `/api/admin/members` (same endpoints as Task 2)
- Pre-fill: courtId from selected slot, dayOfWeek from selectedDate, startTime from slotTime, startDate from selectedDate
- Fields: lesson type, duration, teacher (optional), students (multi-select), day of week (pre-filled but editable), start date, end date (optional), notes
- On submit: POST to `/api/admin/recurring-lessons` (existing endpoint — no API changes needed)
- After success: close dialog, refresh bookings grid, optionally show toast with "Generate sessions?" prompt

**Definition of Done:**

- [ ] Dialog opens with pre-filled court, day of week, and start time from selected grid slot
- [ ] All fields from existing CreateRecurringLessonDialog are available
- [ ] Creating a recurring lesson via dialog calls the existing API
- [ ] Grid refreshes after successful creation
- [ ] `npm run build` passes

**Verify:**

- `npm run build` — zero errors

### Task 4: Reschedule API Endpoints for Bookings and Lessons

**Objective:** Create new API endpoints to reschedule (move) bookings and lessons to a different court/time on the same day, with conflict detection.

**Dependencies:** None

**Files:**

- Create: `app/api/admin/bookings/reschedule/route.ts`
- Create: `app/api/admin/lessons/reschedule/route.ts`

**Key Decisions / Notes:**

- **Booking reschedule** (`POST /api/admin/bookings/reschedule`):
  - Input: `{ bookingId, newCourtId, newStartTime, newEndTime }`
  - Validates booking exists and is not cancelled
  - Checks for conflicts at the new slot (bookings, recurring bookings, lessons)
  - Updates `courtId`, `startTime`, `endTime` in a transaction
  - Returns updated booking
  - Does NOT allow rescheduling recurring booking definitions — only individual bookings

- **Lesson reschedule** (`POST /api/admin/lessons/reschedule`):
  - Input: `{ lessonId, newCourtId, newStartTime }`
  - Calculates `newEndTime` from lesson's existing duration
  - Validates lesson exists and is scheduled
  - Checks for conflicts at the new slot (bookings, recurring bookings, other lessons)
  - Updates `courtId`, `startTime`, `endTime` in a transaction
  - Returns updated lesson
  - Works on individual LessonSession instances (recurring lesson definition unchanged)

- Both endpoints use the same conflict detection pattern as the existing lesson creation POST in `app/api/admin/lessons/route.ts:184-253`

**Definition of Done:**

- [ ] POST `/api/admin/bookings/reschedule` moves a booking to a new court/time on the same day
- [ ] POST `/api/admin/lessons/reschedule` moves a lesson to a new court/time on the same day
- [ ] Both endpoints return 409 if the target slot has a conflict
- [ ] Both endpoints validate authorization (admin only)
- [ ] Both endpoints use transactions for atomicity
- [ ] `npm run build` passes

**Verify:**

- `npm run build` — zero errors
- `curl -X POST http://localhost:3000/api/admin/bookings/reschedule` with valid session returns appropriate response (not 404)

### Task 5: Drag-to-Reschedule UI on the Grid

**Objective:** Add drag handle icons on occupied grid cells and implement HTML5 drag-and-drop to reschedule bookings and lessons by dragging to empty slots within the same day.

**Dependencies:** Task 4

**Files:**

- Create: `components/admin/RescheduleConfirmDialog.tsx`
- Modify: `components/admin/BookingsContent.tsx`

**Key Decisions / Notes:**

- **Drag handle:** Small `GripVertical` icon (from lucide-react) appears on hover in the top-right corner of occupied cells. Only shown when NOT in selection mode.
- **Draggable items:** Individual bookings (`isRecurring: false`) and lessons (`isLesson: true`). Recurring bookings are NOT draggable.
- **Drop targets:** Empty cells in the grid. When dragging, empty cells get a visual highlight (dashed border + light blue background).
- **Drag data:** Set `dataTransfer` with JSON containing `{ id, type: "booking"|"lesson", courtId, slotTime, sport, duration }`. For lessons, include the lesson's duration in slots so the drop target can validate enough empty consecutive slots.
- **Drop handling:** On drop to an empty cell, open `RescheduleConfirmDialog` showing:
  - Item name (booking name or lesson students)
  - Old slot: Court X @ HH:MM
  - New slot: Court Y @ HH:MM
  - Confirm / Cancel buttons
- **On confirm:** Call the reschedule API (Task 4). On success, refresh grid. On conflict (409), show error toast.
- **Visual feedback during drag:** The dragged cell gets `opacity-50`. Valid drop targets get a blue highlight. Invalid targets (occupied cells) don't accept drops.
- **Multi-slot bookings/lessons:** For items spanning multiple slots, the drag data includes the full time range. The item moves as a whole — the drop target is the new start time.

**Definition of Done:**

- [ ] Drag handle icon appears on hover for non-recurring bookings and lessons
- [ ] Drag handle does NOT appear during selection mode
- [ ] Dragging a cell to an empty slot opens confirmation dialog
- [ ] Confirmation dialog shows old and new court/time
- [ ] Confirming calls the reschedule API and refreshes the grid
- [ ] Conflict errors (409) display as toast messages
- [ ] Empty cells highlight as valid drop targets during drag
- [ ] Occupied cells and recurring bookings cannot be dropped onto
- [ ] Recurring bookings do not have drag handles
- [ ] Multi-slot items (pickleball 2hr, lessons) move as a whole
- [ ] `npm run build` passes

**Verify:**

- `npm run build` — zero errors

### Task 6: i18n Translations for All New UI

**Objective:** Add translation keys for all new UI text in en.json, ms.json, and zh.json.

**Dependencies:** Task 1, Task 2, Task 3, Task 5

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/ms.json`
- Modify: `messages/zh.json`

**Key Decisions / Notes:**

- Add keys under `admin.bookings` namespace (existing namespace used by BookingsContent)
- Keys needed for:
  - Slot type chooser: "addBooking", "addLesson", "addRecurringLesson", "chooseType"
  - Lesson creation dialog: "createLessonTitle", "createLessonDescription", "lessonType", "duration", "teacher", "students", "selectTeacher", "selectStudents", "notes", "notesPlaceholder", "maxStudents"
  - Recurring lesson dialog: "createRecurringLessonTitle", "createRecurringLessonDescription", "dayOfWeekLabel", "startDateLabel", "endDateLabel", "repeatWeekly"
  - Reschedule confirmation: "rescheduleTitle", "rescheduleDescription", "from", "to", "confirmReschedule", "rescheduleSuccess", "rescheduleError", "conflictError"
  - Drag: "dragToMove"
- Some keys may already exist (reuse where possible)

**Definition of Done:**

- [ ] All new UI text has translation keys in en.json
- [ ] All new UI text has translations in ms.json
- [ ] All new UI text has translations in zh.json
- [ ] No hardcoded English strings in new components
- [ ] `npm run build` passes

**Verify:**

- `npm run build` — zero errors

## Testing Strategy

- Unit tests: Skip (no test framework configured for this project yet)
- Integration tests: Skip (no test framework configured)
- Manual verification:
  1. Click empty grid cell → popover appears with 3 options
  2. Choose "Booking" → existing booking dialog opens
  3. Choose "Lesson" → lesson dialog opens, create lesson, verify it appears on grid
  4. Choose "Recurring Lesson" → recurring lesson dialog opens, create recurring lesson
  5. Hover over a booking/lesson cell → drag handle appears
  6. Drag booking to different empty slot → confirmation dialog → confirm → booking moves
  7. Drag lesson to different court → confirmation dialog → confirm → lesson moves
  8. Try dragging to occupied slot → rejected with error
  9. Verify recurring bookings are NOT draggable
  10. Switch language → all new text translates correctly

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BookingsContent.tsx becomes too large | High | Med | Extract all new dialogs into separate components. Only add minimal state and event handlers to BookingsContent. |
| Multi-slot drag complexity | Med | Med | For multi-slot items, only move the start time. The API calculates the new end time from the existing duration. |
| HTML5 drag-and-drop browser inconsistencies | Low | Low | Use standard `draggable`, `onDragStart`, `onDragOver`, `onDrop` — widely supported. No need for a library. |
| Conflict detection race condition during drag | Low | Med | Use database transaction in reschedule API (same pattern as lesson creation). |
| Accidental moves without confirmation | Med | High | Always show confirmation dialog before committing a reschedule. |

## Goal Verification

### Truths (what must be TRUE for the goal to be achieved)

- Admin can click an empty grid slot and choose to create a Booking, Lesson, or Recurring Lesson
- Admin can create a one-time lesson from the grid with teacher, students, lesson type, and duration
- Admin can create a recurring lesson from the grid with day-of-week and repeat settings
- Admin can drag a booking to a different court/time on the same day and it moves
- Admin can drag a lesson to a different court/time on the same day and it moves
- A confirmation dialog appears before any drag-move is committed
- Recurring lesson instances move individually without affecting the series definition
- Conflict detection prevents drops onto occupied slots

### Artifacts (what must EXIST to support those truths)

- `components/admin/SlotTypeChooser.tsx` — popover with 3 options
- `components/admin/GridLessonDialog.tsx` — lesson creation dialog
- `components/admin/GridRecurringLessonDialog.tsx` — recurring lesson creation dialog
- `app/api/admin/bookings/reschedule/route.ts` — booking reschedule API
- `app/api/admin/lessons/reschedule/route.ts` — lesson reschedule API
- `components/admin/RescheduleConfirmDialog.tsx` — confirmation dialog for moves

### Key Links (critical connections that must be WIRED)

- SlotTypeChooser → "Lesson" option opens GridLessonDialog with courtId/slotTime
- SlotTypeChooser → "Recurring Lesson" option opens GridRecurringLessonDialog with courtId/dayOfWeek/slotTime
- Grid cell `onDragStart` → sets drag data with booking/lesson info
- Empty cell `onDrop` → opens RescheduleConfirmDialog with old/new slot info
- RescheduleConfirmDialog confirm → calls reschedule API → refreshes grid

## Open Questions

- None — all requirements clarified via MCQ sessions before planning.

### Deferred Ideas

- Cross-day rescheduling (currently same-day only per user requirement)
- Touch/mobile drag support
- Undo functionality for moves
