# Gamification Schema + Points + Admin APIs Implementation Plan

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

**Goal:** Build the data foundation and admin backend for the TZH gamification system — Prisma schema for game sessions/matches/points/player profiles, points calculation logic triggered after match recording, validation helpers, and admin API routes for managing game sessions, attendance, and match results.

**Architecture:** New Prisma models (`GameSession`, `SessionAttendance`, `Match`, `MatchPlayer`, `PlayerPoints`, `PlayerProfile`) with a `PlayerGroup` enum. Admin API routes follow the existing pattern (auth → admin check → validate → logic → response). Points are recalculated automatically when a match is recorded. Player grouping is derived from win rate (≥60% with ≥8 games = ELITE, otherwise ACTIVE).

**Tech Stack:** Next.js 16 App Router, Prisma/PostgreSQL, Vitest, next-intl (admin i18n)

## Scope

### In Scope

- Prisma schema: 6 models + 1 enum + migration
- Points calculation library function (`lib/gamification.ts`)
- Validation helpers: `validateMonth`, `validateTeam`, `validatePlayerGroup`
- Admin API routes:
  - `POST /api/admin/game-sessions` — Create a game session
  - `GET /api/admin/game-sessions` — List game sessions
  - `POST /api/admin/game-sessions/[id]/attendance` — Record attendance
  - `POST /api/admin/game-sessions/[id]/matches` — Record match result (auto-calculates points)
  - `GET /api/admin/leaderboard/full` — Full leaderboard (all players, all ranks)
  - `GET /api/admin/player-groups` — List all players with groupings
  - `PATCH /api/admin/player-groups/[userId]` — Override player group
- i18n translations for admin gamification namespace
- Unit + integration tests for all routes and calculation logic

### Out of Scope

- Player-facing UI (Module 2)
- Leaderboard/stats APIs for players (Module 2)
- Awards system (Phase 2)
- Lucky draw system (Phase 2)
- Win streak bonus (Phase 2 — hardcoded to 0)
- ELO rating system (Phase 3)
- MVP peer voting (Phase 3)

## Prerequisites

- PostgreSQL database accessible
- Existing `User` and `Court` models in schema
- Admin auth pattern (`lib/auth.ts`, `lib/admin.ts`)

## Context for Implementer

> This section is critical for cross-session continuity.

- **Patterns to follow:**
  - Admin API route pattern: `app/api/admin/replacement/route.ts` — auth check via `auth()` + `isAdmin()`, try/catch, consistent error responses
  - Prisma schema conventions: `prisma/schema.prisma` — camelCase fields, snake_case DB columns via `@map()`, CUID IDs, `@@map()` for table names
  - Validation pattern: `lib/validation.ts` — functions return cleaned value or `null`
  - Test pattern: `__tests__/api/replacement.test.ts` — vi.mock for auth and prisma, `createMockNextRequest`, `expectJsonResponse`, `fixtures`

- **Conventions:**
  - File organization: API routes in `app/api/`, lib functions in `lib/`, tests in `__tests__/api/`
  - Error responses: `{ error: "message" }` with appropriate HTTP status codes
  - Admin check: `isAdmin(session.user.email, session.user.isAdmin)` from `lib/admin.ts`
  - i18n: translations in `messages/en.json`, `messages/zh.json`, `messages/ms.json`

- **Key files:**
  - `prisma/schema.prisma` — Database schema (Court uses `Int` ID, not String)
  - `lib/admin.ts` — `isAdmin()` helper
  - `lib/auth.ts` — `auth()` session helper
  - `lib/validation.ts` — Existing validation helpers to extend
  - `lib/lesson-config.ts` — Example of a config/business-logic lib file
  - `__tests__/helpers/api-helpers.ts` — Test utilities (createMockNextRequest, expectJsonResponse, fixtures)
  - `__tests__/helpers/prisma-mock.test.ts` — Prisma mock setup (needs new models added)

- **Gotchas:**
  - `Court.id` is `Int` (auto-increment), not `String`. The PRD schema shows `courtId String?` but it must be `Int?` to match the existing Court model
  - The `User` model already has many relations — new relations must be added carefully
  - Admin auth uses both `session.user.email` AND `session.user.isAdmin` — see `lib/admin.ts`
  - Test framework: Vitest (not Jest). Use `vi.mock`, `vi.fn`, `vi.mocked`

- **Domain context:**
  - A "game session" is an open play / rental session (NOT a lesson). Think pickup badminton.
  - Each session has multiple matches (doubles format: 2v2)
  - Points: attendance=1.0, per game played=0.5, per game won=1.0, streak bonus=0 (Phase 2)
  - Monthly leaderboard resets on 1st of each month
  - Player grouping: ≥60% win rate AND ≥8 games = ELITE, otherwise ACTIVE

## Runtime Environment

- **Start command:** `npm run dev`
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`
- **Restart procedure:** Dev server auto-reloads on file changes

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Prisma schema + migration
- [x] Task 2: Validation helpers + points calculation library
- [x] Task 3: Admin session + attendance APIs
- [x] Task 4: Admin match recording API (with auto point calculation)
- [x] Task 5: Admin leaderboard + player group APIs
- [x] Task 6: i18n translations

**Total Tasks:** 6 | **Completed:** 6 | **Remaining:** 0

## Implementation Tasks

### Task 1: Prisma Schema + Migration

**Objective:** Add all gamification-related Prisma models, enums, and relations. Run migration.

**Dependencies:** None

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `__tests__/helpers/prisma-mock.test.ts` (add new models to mock)

**Key Decisions / Notes:**

- `Court.id` is `Int` — so `GameSession.courtId` must be `Int?` (not `String?` as PRD shows)
- Add relations to `User` model: `gameSessions` (creator), `sessionAttendances`, `matchPlayers`, `playerPoints`, `playerProfile`
- Add `gameSessions` relation to `Court` model (aliased to avoid collision with existing `bookings`)
- `PlayerGroup` enum with `ELITE` and `ACTIVE` values
- 6 new models: `GameSession`, `SessionAttendance`, `Match`, `MatchPlayer`, `PlayerPoints`, `PlayerProfile`
- `PlayerProfile` must include ALL PRD-specified fields: `group` (PlayerGroup enum), `groupOverride` (Boolean), `winRate` (Float), `totalGames` (Int), `totalWins` (Int), `currentStreak` (Int, default 0), `bestStreak` (Int, default 0), `consecutiveWeeks` (Int, default 0), `lastSessionDate` (DateTime?). The streak/consecutive fields won't be updated by Module 1 logic but must exist in the schema to avoid a breaking migration later
- Follow existing snake_case `@map()` conventions throughout
- The `MatchPlayer` model uses a simpler design than the PRD: just `team` (1 or 2) and `isWinner` fields — no separate Team1/Team2 relations needed (the PRD's dual-relation approach creates invalid Prisma relation disambiguation). Filter by `team` field instead. Concrete schema:
  - `Match`: `id`, `sessionId`, `matchNumber`, `team1Score`, `team2Score`, `createdAt`. Single relation: `players MatchPlayer[]`. Add `@@unique([sessionId, matchNumber])` to prevent race conditions on auto-increment
  - `MatchPlayer`: `id`, `matchId`, `userId`, `team` (Int: 1 or 2), `isWinner` (Boolean). Relations: `match Match @relation(fields: [matchId], references: [id])`, `user User @relation(fields: [userId], references: [id])`

**Definition of Done:**

- [ ] All 6 models exist in `prisma/schema.prisma` with correct field types and relations
- [ ] `PlayerGroup` enum exists with ELITE, ACTIVE values
- [ ] `PlayerProfile` model includes all PRD-specified fields: group, groupOverride, winRate, totalGames, totalWins, currentStreak, bestStreak, consecutiveWeeks, lastSessionDate
- [ ] `Match` model has `@@unique([sessionId, matchNumber])` constraint
- [ ] `SessionAttendance` model has `@@unique([sessionId, userId])` constraint
- [ ] User model has new relations for gamification
- [ ] Court model has `gameSessions` relation
- [ ] Migration applied: `npx prisma migrate dev` succeeds
- [ ] `npx prisma generate` runs without errors
- [ ] Prisma mock updated with all new models

**Verify:**

- `npx prisma migrate status` — shows up to date
- `npx prisma generate` — no errors
- `npx vitest run __tests__/helpers/prisma-mock.test.ts` — mock test passes

---

### Task 2: Validation Helpers + Points Calculation Library

**Objective:** Add `validateMonth`, `validateTeam`, `validatePlayerGroup` to validation.ts. Create `lib/gamification.ts` with points recalculation and player group determination functions.

**Dependencies:** Task 1

**Files:**

- Modify: `lib/validation.ts`
- Create: `lib/gamification.ts`
- Create: `__tests__/lib/gamification.test.ts`
- Create: `__tests__/lib/validation-gamification.test.ts`

**Key Decisions / Notes:**

- `validateMonth(input)`: returns `"YYYY-MM"` format string or `null`. Regex: `/^\d{4}-(0[1-9]|1[0-2])$/`
- `validateTeam(input)`: returns `1 | 2 | null`
- `validatePlayerGroup(input)`: returns `"ELITE" | "ACTIVE" | null`
- `recalculateMonthlyPoints(userId, month, tx?)`: counts attendance, games, wins for that month, upserts `PlayerPoints` record. The `month` argument must ALWAYS be derived from `GameSession.date` (YYYY-MM format), never from the current system date — this ensures recording a past session writes points to the correct month
- `updatePlayerGroup(userId, tx?)`: queries MatchPlayer records from the user's last 10 attended sessions (ordered by session date desc). Calculates totalGames, totalWins, winRate within that window. Upserts PlayerProfile — creates with ACTIVE defaults if none exists. Always writes winRate, totalGames, totalWins to PlayerProfile. The 8-game minimum applies within the last-10-sessions window: if totalGames < 8 in that window, group stays ACTIVE regardless of win rate. If totalGames ≥ 8 AND winRate ≥ 0.60, group = ELITE, else ACTIVE. Skips group field update only if `groupOverride = true` (stats are always refreshed regardless)
- Points formula: attendance × 1.0 + gamesPlayed × 0.5 + gamesWon × 1.0 + 0 (streak bonus deferred)
- These are pure business-logic functions that take `prisma` (or `tx`) as a parameter for testability

**Definition of Done:**

- [ ] `validateMonth("2026-02")` returns `"2026-02"`, `validateMonth("bad")` returns `null`
- [ ] `validateTeam(1)` returns `1`, `validateTeam(3)` returns `null`
- [ ] `validatePlayerGroup("ELITE")` returns `"ELITE"`, `validatePlayerGroup("bad")` returns `null`
- [ ] `recalculateMonthlyPoints` correctly sums attendance/games/wins for a month
- [ ] `updatePlayerGroup` sets ELITE when winRate ≥ 0.60 and totalGames ≥ 8
- [ ] `updatePlayerGroup` does NOT override group when `groupOverride = true`, but still writes winRate/totalGames/totalWins
- [ ] `updatePlayerGroup` upserts PlayerProfile (creates with ACTIVE defaults if none exists)
- [ ] All tests pass with mocked Prisma

**Verify:**

- `npx vitest run __tests__/lib/gamification.test.ts` — all pass
- `npx vitest run __tests__/lib/validation-gamification.test.ts` — all pass

---

### Task 3: Admin Session + Attendance APIs

**Objective:** Create admin API routes for creating game sessions and recording attendance. Attendance triggers initial point allocation (1.0 for attendance).

**Dependencies:** Task 1, Task 2

**Files:**

- Create: `app/api/admin/game-sessions/route.ts` (GET list + POST create)
- Create: `app/api/admin/game-sessions/[id]/attendance/route.ts` (POST record)
- Create: `__tests__/api/admin-game-sessions.test.ts`

**Key Decisions / Notes:**

- `POST /api/admin/game-sessions`: body `{ date: string, courtId?: number }`. Creates GameSession with `createdBy` = admin user ID
- `GET /api/admin/game-sessions`: returns paginated list with attendance count and match count, ordered by date desc. Supports `?month=2026-02` filter
- `POST /api/admin/game-sessions/[id]/attendance`: body `{ userIds: string[] }`. Creates SessionAttendance records for each user. Idempotent — skips users already marked as attending. After recording, calls `recalculateMonthlyPoints` for each user with month derived from the session's date (not current date)
- Follow admin route pattern from `app/api/admin/replacement/route.ts` — auth + isAdmin check, try/catch, consistent errors
- Validate `date` is a valid date, `courtId` exists if provided, all `userIds` exist

**Definition of Done:**

- [ ] `POST /api/admin/game-sessions` creates a session and returns 201
- [ ] `GET /api/admin/game-sessions` returns paginated sessions with attendance/match counts
- [ ] `GET /api/admin/game-sessions?month=2026-02` filters by month
- [ ] `POST /api/admin/game-sessions/[id]/attendance` records attendance for multiple users
- [ ] Duplicate attendance is ignored (idempotent)
- [ ] Points are recalculated after attendance is recorded (month derived from session date, not current date)
- [ ] Recording attendance for a past-month session writes points to that month, not the current month
- [ ] All routes return 401 for unauthenticated, 403 for non-admin
- [ ] All tests pass

**Verify:**

- `npx vitest run __tests__/api/admin-game-sessions.test.ts` — all pass
- `npm run build` — no type errors

---

### Task 4: Admin Match Recording API

**Objective:** Create admin API route for recording match results. Auto-triggers point recalculation and player group update for all match participants.

**Dependencies:** Task 1, Task 2, Task 3

**Files:**

- Create: `app/api/admin/game-sessions/[id]/matches/route.ts` (POST record + GET list)
- Create: `__tests__/api/admin-game-matches.test.ts`

**Key Decisions / Notes:**

- `POST /api/admin/game-sessions/[id]/matches`: body `{ team1: string[], team2: string[], team1Score: number, team2Score: number }`. Creates Match + 4 MatchPlayer records. Determines winner (higher score). Returns 400 if scores are equal (badminton/pickleball always have a winner). Auto-increments `matchNumber` within the session
- Validation: exactly 2 players per team for doubles, scores ≥ 0, scores cannot be equal, all players must have attendance for this session, no duplicate players across teams
- The ENTIRE operation — Match creation + 4 MatchPlayer records + recalculateMonthlyPoints for all 4 players + updatePlayerGroup for all 4 players — must execute inside a single `prisma.$transaction`. Pass the transaction client `tx` to recalculateMonthlyPoints and updatePlayerGroup. If any step fails, the entire transaction rolls back
- The `month` argument for `recalculateMonthlyPoints` must be derived from `GameSession.date` (YYYY-MM), NOT from the current system date. This ensures recording a past session writes points to the correct month
- After match creation: call `recalculateMonthlyPoints` for all 4 players, then `updatePlayerGroup` for all 4 players
- Use `prisma.$transaction` for atomicity
- `GET /api/admin/game-sessions/[id]/matches`: returns all matches for the session with player names and scores

**Definition of Done:**

- [ ] `POST .../matches` creates match with 4 match players and returns 201
- [ ] Winner is correctly determined based on scores (team with higher score)
- [ ] Returns 400 if team1Score === team2Score (no draws allowed)
- [ ] Points are recalculated for all 4 players after match (month derived from session date)
- [ ] If recalculateMonthlyPoints or updatePlayerGroup throws, entire transaction rolls back and match is not saved
- [ ] Player groups are updated for all 4 players after match
- [ ] Returns 400 if players don't have attendance for the session
- [ ] Returns 400 if duplicate players across teams
- [ ] Returns 400 if not exactly 2 players per team
- [ ] `GET .../matches` returns matches with player details
- [ ] All tests pass

**Verify:**

- `npx vitest run __tests__/api/admin-game-matches.test.ts` — all pass
- `npm run build` — no type errors

---

### Task 5: Admin Leaderboard + Player Group APIs

**Objective:** Create admin API routes for viewing the full leaderboard and managing player group overrides.

**Dependencies:** Task 1, Task 2

**Files:**

- Create: `app/api/admin/leaderboard/full/route.ts` (GET)
- Create: `app/api/admin/player-groups/route.ts` (GET list all)
- Create: `app/api/admin/player-groups/[userId]/route.ts` (PATCH)
- Create: `__tests__/api/admin-leaderboard.test.ts`

**Key Decisions / Notes:**

- `GET /api/admin/leaderboard/full`: query params `?month=2026-02` (defaults to current month). Returns all PlayerPoints records for the requested month (only players who have a points record for that month), each including userId, playerName, group, attendance points, games points, wins points, bonus points, total points, and 1-based rank sorted by total desc. Capped at 500 rows (sufficient for a single sports centre; no pagination needed)
- `GET /api/admin/player-groups`: returns all users with a PlayerProfile record, including userId, name, group, groupOverride, winRate, totalGames, totalWins. Requires admin auth
- `PATCH /api/admin/player-groups/[userId]`: body `{ group: "ELITE" | "ACTIVE", override: boolean }`. Sets the player's group and groupOverride flag. When `override: true`, auto-grouping won't change it
- Route paths use `/api/admin/game-sessions` instead of the PRD's `/api/admin/sessions` to avoid ambiguity with existing lesson session routes
- Follow admin auth pattern throughout

**Definition of Done:**

- [ ] `GET /api/admin/leaderboard/full` returns PlayerPoints records for the requested month with userId, playerName, group, attendance/games/wins/bonus/total points, and 1-based rank sorted by total desc
- [ ] Players with no PlayerPoints record for the month are not included in leaderboard
- [ ] Default month is current month when no `?month=` param
- [ ] `GET /api/admin/player-groups` returns all players with a PlayerProfile including userId, name, group, groupOverride, winRate, totalGames, totalWins
- [ ] `PATCH /api/admin/player-groups/[userId]` updates group and override flag
- [ ] Returns 400 for invalid group value
- [ ] Returns 404 for non-existent user/profile
- [ ] All routes require admin auth (401/403)
- [ ] All tests pass

**Verify:**

- `npx vitest run __tests__/api/admin-leaderboard.test.ts` — all pass
- `npm run build` — no type errors

---

### Task 6: i18n Translations

**Objective:** Add gamification admin translation keys to all three locale files.

**Dependencies:** Task 3, Task 4, Task 5

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/zh.json`
- Modify: `messages/ms.json`

**Key Decisions / Notes:**

- Add `gamification` namespace with keys for: session management, attendance, match recording, leaderboard, player groups, error messages
- Follow existing translation patterns (see `replacement` namespace for reference)
- Keys needed: titles, button labels, table headers, status labels, error messages, empty states

**Definition of Done:**

- [ ] `messages/en.json` has `gamification` namespace with keys for: session titles/labels, attendance recording, match recording, leaderboard title/headers, player group labels (elite/active), and error messages (sessionNotFound, playerNotAttending, invalidScore, etc.)
- [ ] `messages/zh.json` has `gamification` namespace with Chinese translations
- [ ] `messages/ms.json` has `gamification` namespace with Malay translations
- [ ] All three files are valid JSON
- [ ] `npm run build` compiles with no errors

**Verify:**

- `node -e "require('./messages/en.json'); require('./messages/zh.json'); require('./messages/ms.json'); console.log('All valid')"` — JSON parses
- `npm run build` — no build errors

## Testing Strategy

- **Unit tests:** `lib/gamification.ts` (points calculation, player grouping logic), `lib/validation.ts` (new validators)
- **Integration tests:** Admin API routes (auth checks, CRUD operations, points auto-calculation after match recording)
- **Manual verification:** Start dev server, hit admin endpoints with curl to verify responses

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Points calculation race condition (two matches recorded simultaneously for same player) | Low | Med | Use `prisma.$transaction` for the entire match-record + points-recalculate flow. Recalculate from raw data each time (not increment) |
| Court ID type mismatch (PRD says String, DB uses Int) | High | High | Use `Int?` for `GameSession.courtId` to match existing `Court.id` type |
| Duplicate attendance records | Med | Low | Use `@@unique([sessionId, userId])` constraint + idempotent upsert logic |
| Player group override lost on recalculation | Med | Med | Check `groupOverride === true` before auto-updating group; skip if set |
| Match with non-attending players | Med | Med | Validate all match players have attendance for the session before creating match |

## Open Questions

- None — PRD is comprehensive for Module 1 scope

### Deferred Ideas

- Leaderboard/stats player-facing APIs and UI (Module 2)
- Awards system with Progress Star / Consistency King (Phase 2)
- Lucky draw system (Phase 2)
- Win streak bonus points (Phase 2)
- ELO rating system (Phase 3)
