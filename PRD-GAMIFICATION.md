# PRD: TZH Sports Centre — Community Gamification System

**Version:** 1.0
**Date:** 2026-02-19
**Author:** Harvey (Thomas)
**Status:** Draft
**Depends on:** Existing court booking & session system

---

## Executive Summary

A gamification layer for TZH rental sessions (open play / mixed sessions) that drives attendance, builds community, and makes the session "a habit you can't quit." The system covers dual-track leaderboards, automatic skill-based grouping, progress awards, and a merit-based lucky draw. The core design principle: **everyone has a chance to win, everyone gets seen, nobody gets shamed.**

---

## Design Principles

1. **Participation > Victory** — Showing up matters more than winning
2. **Dual-track scoring** — Monthly reset for fairness + all-time for legacy
3. **Growth > Strength** — Reward improvement, not just skill
4. **Privacy by default** — Only top 10 public; personal stats are private
5. **Gradual rollout** — Launch core first, add advanced features later

---

## Module 1: Points System

### Scoring Rules

| Action | Points | Rationale |
|--------|--------|-----------|
| Attend a session | 1.0 | Participation is the foundation |
| Play 1 game | 0.5 | Reward engagement |
| Win 1 game | 1.0 | Reward competitiveness (but not too much) |
| 3-game win streak | +1.0 bonus | Streak excitement (Phase 2) |

**Key ratio:** Attending + playing 4 games + winning 2 = 1 + 2 + 2 = **5 points**. A player who attends and loses every game still earns **3 points**. This keeps participation valuable.

### Data Model

```prisma
model GameSession {
  id          String   @id @default(cuid())
  date        DateTime
  courtId     String?  @map("court_id")
  court       Court?   @relation(fields: [courtId], references: [id])
  createdBy   String   @map("created_by")
  creator     User     @relation("SessionCreator", fields: [createdBy], references: [id])
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  attendances SessionAttendance[]
  matches     Match[]

  @@map("game_sessions")
}

model SessionAttendance {
  id            String      @id @default(cuid())
  sessionId     String      @map("session_id")
  session       GameSession @relation(fields: [sessionId], references: [id])
  userId        String      @map("user_id")
  user          User        @relation(fields: [userId], references: [id])
  attendedAt    DateTime    @default(now()) @map("attended_at")

  @@unique([sessionId, userId])
  @@map("session_attendances")
}

model Match {
  id          String      @id @default(cuid())
  sessionId   String      @map("session_id")
  session     GameSession @relation(fields: [sessionId], references: [id])
  matchNumber Int         @map("match_number")
  // Doubles: 2 players per team
  team1       MatchPlayer[] @relation("Team1")
  team2       MatchPlayer[] @relation("Team2")
  team1Score  Int         @map("team1_score")
  team2Score  Int         @map("team2_score")
  createdAt   DateTime    @default(now()) @map("created_at")

  @@map("matches")
}

model MatchPlayer {
  id        String @id @default(cuid())
  matchId   String @map("match_id")
  match     Match  @relation(fields: [matchId], references: [id])
  userId    String @map("user_id")
  user      User   @relation(fields: [userId], references: [id])
  team      Int    // 1 or 2
  isWinner  Boolean @default(false) @map("is_winner")

  // For relation disambiguation
  matchTeam1 Match? @relation("Team1")
  matchTeam2 Match? @relation("Team2")

  @@unique([matchId, userId])
  @@map("match_players")
}

model PlayerPoints {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id])
  month       String   // "2026-02" format (for monthly reset)
  attendance  Float    @default(0)  // Points from attending
  games       Float    @default(0)  // Points from playing games
  wins        Float    @default(0)  // Points from winning
  bonus       Float    @default(0)  // Streak bonuses, etc.
  total       Float    @default(0)  // Sum of all
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([userId, month])
  @@map("player_points")
}
```

### Dual-Track Leaderboard

#### Monthly Leaderboard (Resets on 1st of each month)

- Source: `PlayerPoints` filtered by current month
- Public: Top 10 only
- Rank 11+ : player sees own rank privately, not displayed publicly
- Participates in: monthly awards, lucky draw eligibility

#### All-Time Hall of Fame (Never resets)

- Source: Aggregate of all `PlayerPoints` across months
- Public: Top 10 only
- No prizes — pure honor
- Displayed separately on a "Hall of Fame" page

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/leaderboard/monthly` | User | Current month top 10 + own rank |
| GET | `/api/leaderboard/monthly/[month]` | User | Historical month (e.g. "2026-01") |
| GET | `/api/leaderboard/alltime` | User | All-time top 10 + own rank |
| GET | `/api/my-stats` | User | Personal stats: points, win rate, streak, rank |
| POST | `/api/admin/sessions` | Admin | Create a game session |
| POST | `/api/admin/sessions/[id]/attendance` | Admin | Record attendance |
| POST | `/api/admin/sessions/[id]/matches` | Admin | Record match result (auto-calculates points) |
| GET | `/api/admin/leaderboard/full` | Admin | Full leaderboard (all players, all ranks) |

### Points Calculation Logic

```typescript
// Triggered after each match is recorded
async function recalculateMonthlyPoints(userId: string, month: string) {
  const attendances = await countAttendances(userId, month)
  const gamesPlayed = await countGamesPlayed(userId, month)
  const gamesWon = await countGamesWon(userId, month)
  const streakBonus = await calculateStreakBonus(userId, month)  // Phase 2

  const points = {
    attendance: attendances * 1.0,
    games: gamesPlayed * 0.5,
    wins: gamesWon * 1.0,
    bonus: streakBonus,
    total: (attendances * 1.0) + (gamesPlayed * 0.5) + (gamesWon * 1.0) + streakBonus
  }

  await upsertPlayerPoints(userId, month, points)
}
```

---

## Module 2: Player Grouping (Elite / Active)

**Goal:** Make every game competitive and fun. Not "strong vs weak" — instead "appropriate challenge level."

### Public Labels

| Internal | Public Name | Icon |
|----------|-------------|------|
| High skill | 🔥 Elite Group | Fire |
| Standard | ⚡ Active Group | Lightning |

**Never** use words like "beginner", "weak", "B-team" anywhere in UI.

### Grouping Logic (Phase 1: Win Rate)

```typescript
// Recalculate monthly or after every N sessions
function determineGroup(userId: string): 'ELITE' | 'ACTIVE' {
  const stats = await getPlayerStats(userId, { lastNSessions: 10 })

  if (stats.winRate >= 0.60 && stats.gamesPlayed >= 8) {
    return 'ELITE'
  }
  return 'ACTIVE'
}
```

**Rules:**

- Minimum 8 games played before grouping applies (prevents early classification)
- Recalculated after every session
- Players can move between groups (not permanent)
- New players start in Active Group
- Admin can manually override

### Grouping Logic (Phase 2: ELO Rating — Future)

```prisma
model PlayerRating {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  rating    Int      @default(1000)
  peakRating Int     @default(1000) @map("peak_rating")
  gamesRated Int     @default(0) @map("games_rated")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("player_ratings")
}
```

ELO rules (for future implementation):
- Starting rating: 1000
- Beat higher-rated player → larger gain
- Lose to lower-rated player → larger loss
- K-factor: 32 (standard for casual play)
- Elite threshold: rating ≥ 1200
- Active threshold: rating < 1200

### Data Model

```prisma
enum PlayerGroup {
  ELITE
  ACTIVE
}

// Add to User model or create separate
model PlayerProfile {
  id              String      @id @default(cuid())
  userId          String      @unique @map("user_id")
  user            User        @relation(fields: [userId], references: [id])
  group           PlayerGroup @default(ACTIVE)
  groupOverride   Boolean     @default(false) @map("group_override")  // Admin manually set
  winRate         Float       @default(0) @map("win_rate")
  totalGames      Int         @default(0) @map("total_games")
  totalWins       Int         @default(0) @map("total_wins")
  currentStreak   Int         @default(0) @map("current_streak")
  bestStreak      Int         @default(0) @map("best_streak")
  consecutiveWeeks Int        @default(0) @map("consecutive_weeks")  // For consistency award
  lastSessionDate DateTime?   @map("last_session_date")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@map("player_profiles")
}
```

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/my-profile/game` | User | My group, win rate, streak, stats |
| GET | `/api/admin/player-groups` | Admin | All players with groupings |
| PATCH | `/api/admin/player-groups/[userId]` | Admin | Override a player's group |

---

## Module 3: Awards System

### Monthly Awards

| Award | Criteria | Visibility |
|-------|----------|------------|
| 🥇🥈🥉 Top 3 | Highest monthly points | Public leaderboard |
| 🌟 Progress Star | Highest win rate improvement vs last month | Public announcement |
| 💪 Consistency King | 4+ consecutive weeks attendance, zero absences | Public announcement |
| 🏆 MVP (Phase 2) | Peer vote at end of month | Public announcement |

### Progress Star Calculation

```typescript
async function calculateProgressStar(month: string): Promise<string | null> {
  const players = await getAllPlayersWithStats(month)
  const previousMonth = getPreviousMonth(month)

  let bestImprovement = 0
  let progressStar: string | null = null

  for (const player of players) {
    const currentWinRate = player.currentMonth.winRate
    const previousWinRate = player.previousMonth?.winRate ?? 0

    // Must have played minimum 6 games in both months
    if (player.currentMonth.gamesPlayed < 6) continue
    if ((player.previousMonth?.gamesPlayed ?? 0) < 6) continue

    const improvement = currentWinRate - previousWinRate

    if (improvement > bestImprovement) {
      bestImprovement = improvement
      progressStar = player.userId
    }
  }

  return progressStar  // userId of progress star, or null
}
```

**Why this matters:** 70% of players aren't trying to be #1. They want to feel seen and feel progress. Progress Star gives every improving player a shot at recognition.

### Consistency King Calculation

```typescript
async function calculateConsistencyKing(month: string): Promise<string[]> {
  // Players who attended every session week in the month (≥4 weeks)
  // and had zero absences
  return await prisma.playerProfile.findMany({
    where: {
      consecutiveWeeks: { gte: 4 },
      // No absences this month
    },
    select: { userId: true }
  })
}
```

### Data Model

```prisma
model MonthlyAward {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  month     String   // "2026-02"
  award     String   // TOP_1 | TOP_2 | TOP_3 | PROGRESS_STAR | CONSISTENCY_KING | MVP
  metadata  Json?    // { improvement: 0.25, previousWinRate: 0.30, currentWinRate: 0.55 }
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, month, award])
  @@map("monthly_awards")
}
```

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/awards/monthly/[month]` | User | Awards for a given month |
| GET | `/api/my-awards` | User | All my awards |
| POST | `/api/admin/awards/calculate/[month]` | Admin | Trigger award calculation for a month |
| POST | `/api/admin/awards/manual` | Admin | Manually grant an award |

---

## Module 4: Lucky Draw System

### Eligibility Rules

Players must meet **at least one** threshold to qualify:

| Criteria | Threshold |
|----------|-----------|
| Monthly attendance | ≥ 6 sessions |
| Monthly points | ≥ 15 points |

This ensures the lucky draw is a **reward for effort**, not random chance.

### Data Model

```prisma
model LuckyDraw {
  id          String   @id @default(cuid())
  month       String   // "2026-02"
  prize       String   // Description of prize
  prizeValue  Float?   @map("prize_value")
  drawnAt     DateTime? @map("drawn_at")
  createdAt   DateTime @default(now()) @map("created_at")

  entries     LuckyDrawEntry[]
  winnerId    String?  @map("winner_id")
  winner      User?    @relation(fields: [winnerId], references: [id])

  @@map("lucky_draws")
}

model LuckyDrawEntry {
  id          String    @id @default(cuid())
  drawId      String    @map("draw_id")
  draw        LuckyDraw @relation(fields: [drawId], references: [id])
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id])
  qualified   Boolean   @default(false)  // Met threshold
  reason      String?   // "attendance_6" | "points_15" | "both"
  createdAt   DateTime  @default(now()) @map("created_at")

  @@unique([drawId, userId])
  @@map("lucky_draw_entries")
}
```

### Business Rules

1. Admin creates a draw for the month with prize description
2. At month end, system auto-populates eligible entries based on thresholds
3. Admin triggers the draw → system randomly selects winner from eligible entries
4. Winner is announced on leaderboard page
5. Non-eligible players see "Play 2 more sessions to qualify!" (motivation nudge)

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/lucky-draw/current` | User | Current month draw + my eligibility status |
| GET | `/api/lucky-draw/history` | User | Past draw results |
| POST | `/api/admin/lucky-draw` | Admin | Create a draw |
| POST | `/api/admin/lucky-draw/[id]/populate` | Admin | Auto-populate eligible entries |
| POST | `/api/admin/lucky-draw/[id]/draw` | Admin | Execute the random draw |

---

## Module 5: Player-Facing UI

### Leaderboard Page (`/leaderboard`)

**Layout:**

```
┌─────────────────────────────────────────┐
│  🏆 Monthly Leaderboard — Feb 2026     │
│  ┌─────┬─────────────┬────────┐         │
│  │ Rank│ Player      │ Points │         │
│  ├─────┼─────────────┼────────┤         │
│  │ 🥇  │ Ahmad       │ 28.5   │         │
│  │ 🥈  │ Wei Liang   │ 25.0   │         │
│  │ 🥉  │ Raj         │ 23.0   │         │
│  │ 4   │ Mei Ling    │ 21.5   │         │
│  │ ... │ ...         │ ...    │         │
│  │ 10  │ Jason       │ 15.0   │         │
│  └─────┴─────────────┴────────┘         │
│                                          │
│  Your Rank: #14 (12.5 pts) 👀 Only you  │
│                                          │
│  ── Monthly Awards ──                    │
│  🌟 Progress Star: Daniel (+22% WR)     │
│  💪 Consistency King: Siti, Ahmad        │
│                                          │
│  ── Lucky Draw ──                        │
│  🎁 Prize: Free stringing service       │
│  ✅ You are eligible! (8 sessions)       │
│  Draw date: 1 March 2026                │
│                                          │
│  [Hall of Fame →]                        │
└─────────────────────────────────────────┘
```

**Rules:**
- Top 10 shown publicly with names
- Rank 11+ shown only as "Your Rank: #N" to the individual
- **Never** display bottom rankings publicly

### Personal Stats Page (`/my-stats`)

```
┌─────────────────────────────────────────┐
│  📊 My Stats — Feb 2026                │
│                                          │
│  Group: ⚡ Active Group                  │
│  Monthly Points: 12.5 (#14)             │
│  Win Rate: 45% (↑8% vs Jan)            │
│  Games Played: 14                        │
│  Games Won: 6                            │
│  Current Streak: 2W                      │
│  Best Streak: 4W                         │
│  Consecutive Weeks: 3                    │
│                                          │
│  🎯 Lucky Draw: 2 more sessions to go!  │
│                                          │
│  ── My Awards ──                         │
│  🌟 Progress Star — Jan 2026            │
│  💪 Consistency King — Dec 2025          │
└─────────────────────────────────────────┘
```

### Hall of Fame Page (`/hall-of-fame`)

- All-time top 10 only
- Name, total points, peak monthly score, member since
- No prizes attached — pure honor

---

## Module 6: Admin Dashboard

### Session Management (`/admin/sessions`)

- Create game session (date, court)
- Record attendance (check-in players)
- Record match results (select 4 players for doubles, enter scores)
- Auto-triggers point recalculation after each match

### Leaderboard Admin (`/admin/leaderboard`)

- Full player list with all stats (not limited to top 10)
- Override player group (Elite ↔ Active)
- Export monthly stats as CSV

### Awards Admin (`/admin/awards`)

- "Calculate Awards" button for month-end
- Preview calculated awards before publishing
- Manual award creation
- Lucky draw management (create, populate, execute)

---

## Implementation Notes

### Follows Existing Patterns

- **Validation:** Use `lib/validation.ts` helpers — add `validateMonth(input): string | null` for "2026-02" format
- **API routes:** Standard auth → validate → logic → response (see `.claude/rules/api-routes.md`)
- **Database:** Prisma with snake_case columns, CUID IDs, `@@map()` directives (see `.claude/rules/database.md`)
- **Dark mode:** Theme-aware Tailwind only (see `.claude/rules/dark-mode.md`)
- **i18n:** Add translations for namespaces: `leaderboard`, `stats`, `awards`, `luckyDraw`

### New Validation Helpers

Add to `lib/validation.ts`:

```typescript
validateMonth(input: string): string | null      // "2026-02" format
validateTeam(input: number): 1 | 2 | null        // Match team number
validatePlayerGroup(input: string): 'ELITE' | 'ACTIVE' | null
validateAwardType(input: string): string | null   // TOP_1, PROGRESS_STAR, etc.
```

### Anti-Gaming Safeguards

| Risk | Mitigation |
|------|------------|
| Players deliberately losing to stay in Active Group | Track unusual patterns; admin can override group |
| Friends recording fake matches | Admin-only match recording; players cannot self-report |
| Attendance farming (show up, don't play) | Games played count is separate from attendance |
| Win-trading between friends | Randomize match pairings where possible |

### Notifications

Use existing `Notification` model:

- Monthly leaderboard reset notification (1st of month)
- Award earned notification
- Lucky draw eligibility reached
- Lucky draw result
- Group change (Active → Elite or vice versa)

---

## Execution Order

```
Phase 1 — Core (Launch First)
├── Points system (attendance + games + wins)
├── Monthly leaderboard (top 10 public)
├── Personal stats page
└── Admin: session + match recording

Phase 2 — Engagement
├── All-time Hall of Fame
├── Progress Star + Consistency King awards
├── Lucky draw system
└── Win streak bonus (+1 for 3-streak)

Phase 3 — Advanced (Future)
├── ELO rating system (replace win-rate grouping)
├── MVP peer voting
├── Monthly Best Teammate award
└── Season championships (quarterly playoffs)
```

---

## Success Metrics

| Metric | Target | Module |
|--------|--------|--------|
| Session attendance rate | +20% | Points + Leaderboard |
| Player retention (month over month) | +30% | Awards + Lucky Draw |
| New player return rate (2nd session) | >70% | Active Group + Progress Star |
| Admin time recording results | <5 min per session | Session Management UI |
| Player engagement with stats page | >60% weekly visits | Personal Stats |
