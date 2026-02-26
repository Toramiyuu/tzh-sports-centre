# PRD: TZH Sports Centre — Phase 2 Feature Expansion

**Version:** 1.0
**Date:** 2026-02-19
**Author:** Harvey (Thomas)
**Status:** Draft

---

## Executive Summary

Expand TZH Sports Centre from a booking management system into a full ecosystem: automated student management, self-service operations, subscription revenue, and digital product sales. The goal is to eliminate WhatsApp-based admin overhead, increase per-student revenue (ARPU), and build a scalable coaching IP business.

---

## Phase 1 — Admin Efficiency (Priority: Highest)

### Module 1: Absence System

**Goal:** Train students to plan ahead. Eliminate "人情" (social obligation) pressure by letting rules be enforced by the system, not the coach.

#### Data Model Changes

```prisma
// Add to schema.prisma

enum AbsenceType {
  APPLY       // ≥7 days notice → earns replacement credit
  LATE_NOTICE // 3-6 days notice → no credit
  ABSENT      // <3 days or no-show → no credit
  MEDICAL     // Pending admin review
}

enum AbsenceStatus {
  APPROVED        // Auto-approved (APPLY type)
  RECORDED        // Auto-recorded (LATE_NOTICE / ABSENT)
  PENDING_REVIEW  // Awaiting admin decision (MEDICAL)
  REVIEWED        // Admin has decided
}

model Absence {
  id              String         @id @default(cuid())
  userId          String         @map("user_id")
  user            User           @relation(fields: [userId], references: [id])
  lessonSessionId String         @map("lesson_session_id")
  lessonSession   LessonSession  @relation(fields: [lessonSessionId], references: [id])
  type            AbsenceType
  status          AbsenceStatus  @default(APPROVED)
  reason          String?
  proofUrl        String?        @map("proof_url")    // MC upload for medical
  adminNotes      String?        @map("admin_notes")
  creditAwarded   Boolean        @default(false) @map("credit_awarded")
  reviewedBy      String?        @map("reviewed_by")
  reviewedAt      DateTime?      @map("reviewed_at")
  lessonDate      DateTime       @map("lesson_date")  // The date of the missed lesson
  appliedAt       DateTime       @default(now()) @map("applied_at")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  @@map("absences")
}

model ReplacementCredit {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id])
  absenceId   String    @unique @map("absence_id")
  absence     Absence   @relation(fields: [absenceId], references: [id])
  usedAt      DateTime? @map("used_at")
  expiresAt   DateTime  @map("expires_at")  // e.g. 30 days from issue
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("replacement_credits")
}
```

#### Business Rules

| Condition | Type | System Action |
|-----------|------|---------------|
| Applied ≥7 days before lesson | `APPLY` | Auto-approve, create 1 `ReplacementCredit` (expires in 30 days) |
| Notified 3–6 days before | `LATE_NOTICE` | Auto-record, no credit |
| Notified <3 days or same day | `ABSENT` | Auto-record, no credit |
| Medical / special circumstance | `MEDICAL` | Set `PENDING_REVIEW`, admin decides via dashboard |

**Key distinction the UI must make clear:**
- "Apply Absence" = ≥7 days, student gets replacement credit
- "Notify Absence" = <7 days, just a record — no replacement

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/absences` | User | Submit absence (system auto-classifies type based on date diff) |
| GET | `/api/absences` | User | List my absences |
| GET | `/api/absences/credits` | User | List my unused replacement credits |
| GET | `/api/admin/absences` | Admin | List all absences (filterable by type, status) |
| PATCH | `/api/admin/absences/[id]/review` | Admin | Review a MEDICAL absence (approve/deny credit) |

#### Student-Facing UI

- **Location:** New section under user profile or `/absence`
- Show upcoming lessons with "Apply Absence" or "Notify Absence" button (label changes based on days remaining)
- Calendar view of absences + replacement credits
- Badge showing available replacement credits count
- For medical: file upload for MC/proof, text field for reason

#### Admin Dashboard UI

- **Location:** New tab in admin dashboard `/admin/absences`
- Pending review queue (MEDICAL type) at top
- Table: all absences, filterable by type / status / student / date range
- Quick action: approve/deny credit with notes
- Stats: absence rate per student, most common type

---

### Module 2: Self-Service Replacement Booking

**Goal:** Eliminate WhatsApp back-and-forth for replacement scheduling. Save ~80% admin communication time.

#### Data Model Changes

```prisma
// Add to schema.prisma

model ReplacementBooking {
  id                  String            @id @default(cuid())
  userId              String            @map("user_id")
  user                User              @relation(fields: [userId], references: [id])
  replacementCreditId String            @unique @map("replacement_credit_id")
  replacementCredit   ReplacementCredit @relation(fields: [replacementCreditId], references: [id])
  lessonSessionId     String            @map("lesson_session_id")
  lessonSession       LessonSession     @relation(fields: [lessonSessionId], references: [id])
  status              ReplacementBookingStatus @default(CONFIRMED)
  createdAt           DateTime          @default(now()) @map("created_at")
  updatedAt           DateTime          @updatedAt @map("updated_at")

  @@map("replacement_bookings")
}

enum ReplacementBookingStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

#### Admin Configuration Needed

Add to existing admin settings or create new config:

```prisma
model LessonSlotConfig {
  id                String  @id @default(cuid())
  lessonSessionId   String  @map("lesson_session_id")
  lessonSession     LessonSession @relation(fields: [lessonSessionId], references: [id])
  maxStudents       Int     @default(6) @map("max_students")
  allowReplacement  Boolean @default(true) @map("allow_replacement")
  allowExtraClass   Boolean @default(true) @map("allow_extra_class")

  @@map("lesson_slot_configs")
}
```

#### Business Rules

1. Student clicks "Replacement Class"
2. System shows only sessions where:
   - `allowReplacement = true`
   - Current students < `maxStudents`
   - Session date is in the future
   - Session matches student's sport type (badminton/pickleball)
3. Student selects a session → system auto-deducts 1 `ReplacementCredit`
4. Credit is marked `usedAt = now()`
5. Student appears in that session's attendance

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/replacement/available` | User | List available sessions for replacement (with slot count) |
| POST | `/api/replacement/book` | User | Book replacement using a credit |
| DELETE | `/api/replacement/[id]` | User | Cancel replacement (credit returned if >24h before session) |
| GET | `/api/admin/replacement` | Admin | View all replacement bookings |

#### Student-Facing UI

- **Location:** `/replacement` or section within profile
- Show available replacement credits (count + expiry dates)
- Calendar/list view of available sessions showing:
  - Date & time
  - Coach name
  - Sport type
  - Available slots (e.g. "2/6 spots left")
- One-click booking with confirmation modal
- My upcoming replacement sessions list

---

## Phase 2 — Revenue Growth (Priority: High)

### Module 3: Extra Class Booking

**Goal:** Increase ARPU by letting students purchase additional sessions beyond their package — even without replacement credits.

#### Data Model Changes

```prisma
// Add to schema.prisma

model ExtraClassBooking {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  user            User      @relation(fields: [userId], references: [id])
  lessonSessionId String    @map("lesson_session_id")
  lessonSession   LessonSession @relation(fields: [lessonSessionId], references: [id])
  amountPaid      Float     @map("amount_paid")     // RM60-70
  paymentMethod   String    @map("payment_method")   // tng | duitnow | stripe
  paymentStatus   String    @default("PENDING") @map("payment_status")
  receiptUrl      String?   @map("receipt_url")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("extra_class_bookings")
}
```

#### Business Rules

- Available to all registered students (members and non-members)
- Price: configurable per session type, default RM60–70 (intentionally higher than per-session average in a package — replacement is a right, extra class is an upsell)
- Same slot availability logic as replacement booking
- Payment required before confirmation (TnG/DuitNow receipt upload → admin verify, or Stripe)
- Follow existing payment verification workflow from `Booking` model

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/extra-class/available` | User | List available sessions (same pool as replacement) |
| POST | `/api/extra-class/book` | User | Book + initiate payment |
| POST | `/api/extra-class/[id]/receipt` | User | Upload payment receipt |
| GET | `/api/admin/extra-class` | Admin | List all extra class bookings |
| PATCH | `/api/admin/extra-class/[id]/verify` | Admin | Verify payment |

#### Pricing Config

```prisma
model ExtraClassPricing {
  id        String  @id @default(cuid())
  sport     String  // badminton | pickleball
  price     Float   // RM amount
  isActive  Boolean @default(true) @map("is_active")

  @@map("extra_class_pricing")
}
```

#### UI

- **Location:** `/extra-class` or combined with replacement view
- Same calendar/list as replacement but with price shown
- "Book & Pay" flow instead of credit deduction
- Payment method selection (TnG / DuitNow / Stripe)
- Receipt upload step (for manual methods)

---

### Module 4: RM60 Pain-Point Correction Session (Trial/One-Off)

**Goal:** Low-barrier entry product for non-students. Convert casual players and online followers into paying students.

#### Data Model Changes

```prisma
// Add to schema.prisma

model CorrectionSession {
  id            String   @id @default(cuid())
  // Can be a registered user or guest
  userId        String?  @map("user_id")
  user          User?    @relation(fields: [userId], references: [id])
  // Guest info (if not registered)
  guestName     String?  @map("guest_name")
  guestPhone    String?  @map("guest_phone")
  guestEmail    String?  @map("guest_email")
  // Session details
  sport         String   // badminton | pickleball
  painPoint     String   @map("pain_point")  // Free text: what they want to fix
  preferredDate DateTime? @map("preferred_date")
  scheduledAt   DateTime? @map("scheduled_at")
  duration      Int      @default(30)  // 30-40 minutes
  price         Float    @default(60)  // RM60
  // Payment
  paymentMethod String?  @map("payment_method")
  paymentStatus String   @default("PENDING") @map("payment_status")
  receiptUrl    String?  @map("receipt_url")
  // Status
  status        String   @default("PENDING") // PENDING | CONFIRMED | COMPLETED | CANCELLED
  adminNotes    String?  @map("admin_notes")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("correction_sessions")
}
```

#### Business Rules

- Open to ANYONE (no login required for initial booking — collect name + phone)
- 30–40 minute session, RM60 fixed price
- Student describes their "pain point" (e.g. "backhand always goes into net")
- Admin confirms available slot → student pays → session confirmed
- Post-session: prompt to register for full lesson package (upsell funnel)

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/correction-session` | Public | Submit request (guest or logged-in) |
| GET | `/api/correction-session/[id]` | Public | Check status (by ID, no auth needed) |
| GET | `/api/admin/correction-sessions` | Admin | List all requests |
| PATCH | `/api/admin/correction-sessions/[id]` | Admin | Confirm/schedule/cancel + set notes |

#### Public-Facing UI

- **Location:** `/correction` — accessible from homepage and marketing
- Simple form: Name, Phone, Sport, "What do you want to fix?", Preferred date
- No login required
- Confirmation page with booking reference
- Payment instructions after admin confirms slot

---

## Phase 3 — Brand & Retention (Priority: Medium)

### Module 5: Quarterly Assessment System

**Goal:** Strongest differentiation from other coaches. Data-driven coaching with tangible progress tracking.

#### Data Model Changes

```prisma
// Add to schema.prisma

model Assessment {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id])
  quarter         String   // e.g. "2026-Q1"
  assessedBy      String   @map("assessed_by")  // Coach name
  // Skill scores (1-10 scale)
  scores          Json     // Flexible: { "forehand": 7, "footwork": 5, "serve": 8, ... }
  previousScores  Json?    @map("previous_scores")  // Last quarter for comparison
  overallScore    Float?   @map("overall_score")
  // Qualitative
  strengths       String?
  areasToImprove  String?  @map("areas_to_improve")
  nextQuarterFocus String? @map("next_quarter_focus")
  coachNotes      String?  @map("coach_notes")
  // Video
  videoUrl        String?  @map("video_url")  // YouTube unlisted link
  videoNotes      String?  @map("video_notes")
  // Status
  status          String   @default("DRAFT")  // DRAFT | PUBLISHED
  publishedAt     DateTime? @map("published_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("assessments")
}
```

#### Business Rules

- Run every 3 months (Q1/Q2/Q3/Q4)
- Admin creates assessment per student → fills scores + notes → publishes
- Student sees a "Digital Assessment Card" in their profile
- Before/after video: coach uploads to YouTube as **Unlisted**, pastes link into assessment
- Scores are stored as JSON for flexibility (different sports may have different skill categories)
- Previous quarter scores auto-loaded for comparison

#### Default Skill Categories

**Badminton:** Forehand Clear, Backhand Clear, Drop Shot, Smash, Net Play, Footwork, Serve, Game Sense, Consistency

**Pickleball:** Forehand Drive, Backhand Drive, Dink, Volley, Serve, Return, Third Shot Drop, Court Positioning, Strategy

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/assessments` | User | My assessments (all quarters) |
| GET | `/api/assessments/[id]` | User | Single assessment detail |
| POST | `/api/admin/assessments` | Admin | Create new assessment |
| PATCH | `/api/admin/assessments/[id]` | Admin | Update / publish assessment |
| GET | `/api/admin/assessments` | Admin | List all assessments (filterable) |

#### Student-Facing UI

- **Location:** `/profile/assessments` or `/my-progress`
- Current quarter card: radar chart of skills, score table with ↑↓ arrows vs last quarter
- Progress over time: line chart per skill across quarters
- Embedded YouTube video (unlisted)
- Coach notes and next quarter focus

#### Admin UI

- **Location:** `/admin/assessments`
- Create/edit assessment form with slider inputs (1-10) per skill
- Side-by-side comparison with previous quarter (auto-populated)
- YouTube URL input field
- Publish button (sends notification to student)

---

## Phase 4 — Monetization & IP (Priority: Lower)

### Module 6: RM99/month Assessment Subscription

**Goal:** Recurring revenue from personalized weekly video feedback. High margin, low cost, high retention.

#### Data Model Changes

```prisma
// Add to schema.prisma

model AssessmentSubscription {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id])
  status          String   @default("ACTIVE")  // ACTIVE | PAUSED | CANCELLED
  monthlyPrice    Float    @default(99) @map("monthly_price")
  startDate       DateTime @map("start_date")
  nextBillingDate DateTime @map("next_billing_date")
  cancelledAt     DateTime? @map("cancelled_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  feedbacks       WeeklyFeedback[]

  @@map("assessment_subscriptions")
}

model WeeklyFeedback {
  id              String   @id @default(cuid())
  subscriptionId  String   @map("subscription_id")
  subscription    AssessmentSubscription @relation(fields: [subscriptionId], references: [id])
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id])
  weekNumber      Int      @map("week_number")  // Week of year
  videoUrl        String   @map("video_url")     // 1-3 min YouTube unlisted
  focusArea       String   @map("focus_area")
  feedback        String                          // Coach's written feedback
  drillSuggestion String?  @map("drill_suggestion")
  publishedAt     DateTime? @map("published_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("weekly_feedbacks")
}
```

#### Business Rules

- Only available to **existing students** (must have active lesson enrollment)
- RM99/month recurring — manual payment (TnG/DuitNow) or Stripe subscription
- Each week: coach uploads 1–3 min personalized video critique (YouTube unlisted)
- Reduces in-class repetitive explanation → saves lesson time
- If no feedback uploaded in a week, system flags it for admin

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/assessment-subscription` | User | Subscribe |
| GET | `/api/assessment-subscription` | User | My subscription + feedback history |
| GET | `/api/assessment-subscription/feedbacks` | User | List my weekly feedbacks |
| POST | `/api/admin/weekly-feedback` | Admin | Upload weekly feedback for a subscriber |
| GET | `/api/admin/assessment-subscriptions` | Admin | List all subscriptions |
| GET | `/api/admin/weekly-feedback/pending` | Admin | Students missing this week's feedback |

---

### Module 7: Digital Video Products (E-Commerce Extension)

**Goal:** Productize coaching knowledge for external market — court renters, beginners, online audience.

#### Data Model Changes

```prisma
// Add to schema.prisma

enum VideoProductTier {
  BASIC       // RM49 — single technique breakdowns
  COMPLETE    // RM199-249 — full system
}

model VideoProduct {
  id            String           @id @default(cuid())
  title         String
  titleZh       String?          @map("title_zh")
  titleMs       String?          @map("title_ms")
  description   String
  descriptionZh String?          @map("description_zh")
  descriptionMs String?          @map("description_ms")
  tier          VideoProductTier
  sport         String           // badminton | pickleball
  category      String           // forehand | backhand | footwork | serve | complete
  price         Float
  thumbnailUrl  String?          @map("thumbnail_url")
  isActive      Boolean          @default(true) @map("is_active")
  sortOrder     Int              @default(0) @map("sort_order")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  videos        VideoLesson[]
  purchases     VideoPurchase[]

  @@map("video_products")
}

model VideoLesson {
  id              String       @id @default(cuid())
  productId       String       @map("product_id")
  product         VideoProduct @relation(fields: [productId], references: [id])
  title           String
  videoUrl        String       @map("video_url")  // YouTube unlisted
  durationSeconds Int          @map("duration_seconds")
  sortOrder       Int          @default(0) @map("sort_order")
  createdAt       DateTime     @default(now()) @map("created_at")

  @@map("video_lessons")
}

model VideoPurchase {
  id            String       @id @default(cuid())
  userId        String       @map("user_id")
  user          User         @relation(fields: [userId], references: [id])
  productId     String       @map("product_id")
  product       VideoProduct @relation(fields: [productId], references: [id])
  amountPaid    Float        @map("amount_paid")
  paymentMethod String       @map("payment_method")
  paymentStatus String       @default("PENDING") @map("payment_status")
  receiptUrl    String?      @map("receipt_url")
  purchasedAt   DateTime?    @map("purchased_at")
  createdAt     DateTime     @default(now()) @map("created_at")

  @@map("video_purchases")
}
```

#### Product Tiers

| Tier | Price | Target Audience | Content |
|------|-------|-----------------|---------|
| BASIC (RM49) | Per module | Renters, beginners, external | Single technique breakdown (e.g. Forehand module) |
| COMPLETE (RM199–249) | Full package | Serious learners | Complete technique system for a sport |

#### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/video-products` | Public | List all active products (no video URLs) |
| GET | `/api/video-products/[id]` | Public | Product detail (preview only) |
| POST | `/api/video-products/[id]/purchase` | User | Purchase a product |
| GET | `/api/my-videos` | User | My purchased products (with video URLs) |
| POST | `/api/admin/video-products` | Admin | Create product |
| PATCH | `/api/admin/video-products/[id]` | Admin | Update product |
| POST | `/api/admin/video-products/[id]/lessons` | Admin | Add video lesson to product |

#### Public-Facing UI

- **Location:** `/learn` or `/videos` — accessible from main nav
- Product cards: thumbnail, title, price, sport tag
- Product detail page: description, lesson list (titles only), preview thumbnail, buy button
- After purchase: full video player page with lesson list

---

## Implementation Notes

### Follows Existing Patterns

All new code must follow the conventions already established in the codebase:

- **Validation:** Use helpers from `lib/validation.ts` (see `.claude/rules/validation.md`)
- **API routes:** Follow auth check → validation → logic → response pattern (see `.claude/rules/api-routes.md`)
- **Database:** Prisma with snake_case columns, camelCase fields, soft deletes, CUID IDs (see `.claude/rules/database.md`)
- **Dark mode:** Only theme-aware Tailwind classes, no hardcoded hex (see `.claude/rules/dark-mode.md`)
- **i18n:** Add EN/ZH/MS translations for all user-facing strings (see `.claude/rules/i18n-patterns.md`)
- **Auth:** Use `auth()` from `@/lib/auth`, check `isAdmin` from DB not session
- **Payments:** Follow existing TnG/DuitNow receipt upload + admin verify workflow from `Booking` model

### New Validation Helpers Needed

Add to `lib/validation.ts`:

```typescript
validateAbsenceType(input: string): AbsenceType | null
validateQuarter(input: string): string | null  // "2026-Q1" format
validateVideoProductTier(input: string): VideoProductTier | null
```

### i18n Keys to Add

New namespaces in `messages/*.json`:

- `absence` — Absence system strings
- `replacement` — Replacement booking strings
- `extraClass` — Extra class strings
- `correction` — Correction session strings
- `assessment` — Quarterly assessment strings
- `subscription` — Assessment subscription strings
- `videoProducts` — Video product strings

### Notifications

Use existing `Notification` model to notify students when:

- Absence is auto-classified (confirmation)
- Medical absence is reviewed
- Replacement credit is about to expire (3 days before)
- Assessment is published
- Weekly feedback is uploaded
- Correction session is confirmed/scheduled

---

## Execution Order

```
Phase 1 (Do First — Admin Efficiency)
├── Module 1: Absence System
└── Module 2: Self-Service Replacement Booking

Phase 2 (Cash Flow Growth)
├── Module 3: Extra Class Booking
└── Module 4: RM60 Correction Session

Phase 3 (Brand & Retention)
├── Module 5: Quarterly Assessment System
└── Module 6: RM99 Monthly Assessment Subscription

Phase 4 (IP Commercialization)
└── Module 7: Digital Video Products
```

**Rule: Do NOT start a later phase until the previous phase is fully tested and deployed.**

---

## Success Metrics

| Metric | Target | Module |
|--------|--------|--------|
| WhatsApp messages for scheduling | -80% | Modules 1-2 |
| Admin time on absence management | -90% | Module 1 |
| Replacement bookings via system | >95% self-service | Module 2 |
| Extra class revenue per month | +RM500-1000 | Module 3 |
| Correction session conversions | 30% → full enrollment | Module 4 |
| Student retention rate | +15% | Module 5 |
| Subscription revenue (MRR) | RM1,000+ | Module 6 |
| Video product revenue | RM2,000+/month | Module 7 |
