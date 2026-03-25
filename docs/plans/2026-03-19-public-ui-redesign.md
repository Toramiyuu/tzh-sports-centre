# Public-Facing UI Redesign Implementation Plan

Created: 2026-03-19
Status: COMPLETE
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Polish and modernize all non-admin pages with a clean, minimal design — improved spacing, typography hierarchy, consistent component styling, and Lucide icons replacing emojis. Keep the current blue color palette.

**Architecture:** Restyle existing components in-place. No structural refactoring. The work is purely visual — updating Tailwind classes, improving spacing/padding, refining typography scales, adding subtle transitions, and ensuring consistency across all public pages.

**Tech Stack:** Tailwind CSS v4, Lucide React icons, Radix UI (shadcn), Framer Motion (existing), next-intl (existing)

## Scope

### In Scope
- Homepage (all 9 sections: Hero, CourtStatus, About, Sports, Pricing, Reviews, Stringing, Shop, Location)
- Navbar + Footer (shared layout)
- Booking page (restyle only, no restructuring)
- Lessons page
- Leaderboard page
- Shop page + ShopHero
- Dashboard page (bookings overview)
- Profile page (tab shell)
- Training/Member dashboard
- Stringing page
- Updates page
- Auth pages (login, register)
- LoadingScreen
- StickyBookingCTA
- Replace all emoji icons in navbar with Lucide SVG icons

### Out of Scope
- Admin pages (all `/admin/*`)
- Teacher dashboard (`/teacher`)
- API routes (no backend changes)
- Database schema changes
- i18n translation content changes
- Booking page structural refactoring (restyle only)
- Profile tab sub-components (PersonalInfoTab, BookingsTab, etc.) — only the profile page shell
- New features or functionality changes

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - All colors use CSS variables via Tailwind theme classes (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary`, etc.) — see `app/globals.css:50-118`
  - Dark mode via `.dark` class (next-themes) — never hardcode hex colors
  - Animations use `animate-in` from `tw-animate-css` with `fill-mode-forwards`
  - `hover-lift` utility class defined in `globals.css:142-148`
  - Font display: `font-display` maps to Outfit font
  - `max-w-[1200px]` or `max-w-7xl` used as page containers

- **Conventions:**
  - Components use `useTranslations()` from next-intl for all user-visible text
  - Lucide React for icons (already used everywhere except navbar emojis)
  - shadcn/ui components: `Card`, `Button`, `Badge`, `Input`, `Label`, `Dialog`
  - Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

- **Key files:**
  - `app/globals.css` — CSS variables, animation utilities, theme colors
  - `app/layout.tsx` — Root layout with Navbar, Footer, StickyBookingCTA, fonts (Geist, Geist Mono, Outfit)
  - `components/Navbar.tsx` — Fixed top nav, desktop + mobile menu, emoji icons to replace
  - `components/Footer.tsx` — 4-column footer grid
  - `components/home/*.tsx` — 9 homepage section components
  - `app/booking/page.tsx` — 1619 lines, monolithic booking flow
  - `app/lessons/page.tsx` — Lesson packages with cards
  - `app/leaderboard/page.tsx` — Podium + list leaderboard
  - `app/shop/page.tsx` — Product grid with filters
  - `components/shop/ShopHero.tsx` — Parallax hero with framer-motion
  - `app/dashboard/page.tsx` — Bookings dashboard
  - `app/profile/page.tsx` — Profile with tab navigation (373 lines)
  - `components/member/MemberDashboard.tsx` — Training/member area (488 lines)
  - `app/stringing/page.tsx` — String selection + checkout flow (534 lines)
  - `app/updates/page.tsx` — Timeline changelog
  - `app/auth/login/page.tsx`, `app/auth/register/page.tsx` — Auth forms
  - `components/LoadingScreen.tsx` — Full-screen loading spinner
  - `components/StickyBookingCTA.tsx` — Mobile floating booking button

- **Gotchas:**
  - Booking page is 1619 lines — restyle carefully with minimal changes, don't restructure
  - The navbar uses emoji characters (not emoji images) for nav links — replace with Lucide icon components
  - `ShopHero` uses framer-motion — preserve the parallax behavior
  - Some home sections use hardcoded English text alongside i18n — keep the same pattern, don't change content
  - `bg-gradient-to-t from-[#202219]/60` in lessons hero — this is an overlay on a dark image, acceptable exception to the no-hex rule

- **Domain context:**
  - Sports centre in Penang, Malaysia — badminton + pickleball courts
  - RM (Malaysian Ringgit) pricing
  - Peak/off-peak pricing for badminton
  - Member vs non-member access (leaderboard, training are member-only)

## Runtime Environment

- **Start:** `npm run dev` (port 3000)
- **Health check:** `http://localhost:3000`

## Assumptions

- Current blue palette (#1854d6 primary, #f5f8ff bg) is kept as-is — supported by user decision — All tasks depend on this
- No new npm dependencies needed — existing Tailwind, Lucide, framer-motion cover all needs — All tasks depend on this
- Booking page is restyle-only (Tailwind class changes) with no component extraction — supported by user decision — Task 5 depends on this
- Profile tab sub-components (PersonalInfoTab, BookingsTab, etc.) are out of scope — only the shell page is restyled — Task 8 depends on this
- Emoji icons in navbar are replaced with Lucide React icons — supported by user decision — Task 1 depends on this

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Booking page restyle breaks functionality | Medium | High | Only change Tailwind classes, no JS logic changes. Test booking flow end-to-end after. |
| Dark mode regressions | Medium | Medium | Use only theme-aware classes (bg-background, text-foreground, etc). Never hardcode colors. Test both themes per task. |
| Mobile responsiveness issues | Medium | Medium | Check all breakpoints (375px, 768px, 1024px, 1440px) for key pages. |
| Stringing page scroll/filter breaks | Low | Medium | Only change visual classes, preserve all event handlers and state logic. |

## Goal Verification

### Truths
1. All navbar emoji icons are replaced with Lucide SVG icons
2. Typography hierarchy is consistent across all public pages (heading sizes, body text, muted text)
3. Spacing is improved and consistent (section padding, card padding, element gaps)
4. All pages use theme-aware colors (no hardcoded hex except image overlays)
5. Hover states and transitions are smooth and consistent (150-300ms)
6. Mobile layout looks polished at 375px width
7. Dark mode works correctly on all restyled pages

### Artifacts
- `components/Navbar.tsx` — Lucide icons, refined spacing
- `components/Footer.tsx` — Improved typography and spacing
- `components/home/*.tsx` — All 9 sections polished
- `app/booking/page.tsx` — Refined spacing and visual consistency
- `app/lessons/page.tsx` — Improved card styling
- `app/leaderboard/page.tsx` — Polished podium and list
- `app/shop/page.tsx` + `components/shop/ShopHero.tsx` — Refined product grid
- `app/dashboard/page.tsx` — Cleaner bookings list
- `app/profile/page.tsx` — Polished tab navigation
- `components/member/MemberDashboard.tsx` — Improved dashboard cards
- `app/auth/login/page.tsx` + `app/auth/register/page.tsx` — Refined auth forms

## Progress Tracking

- [x] Task 1: Navbar & Footer — shared layout polish
- [x] Task 2: Homepage Hero + CourtStatus + About sections
- [x] Task 3: Homepage Sports + Pricing + Reviews sections
- [x] Task 4: Homepage Stringing + Shop + Location sections
- [x] Task 5: Booking page restyle
- [x] Task 6: Lessons page restyle
- [x] Task 7: Leaderboard page restyle
- [x] Task 8: Shop page + ShopHero restyle
- [x] Task 9: Dashboard + Profile + Member Dashboard restyle
- [x] Task 10: Stringing + Updates + Auth pages + LoadingScreen + StickyBookingCTA

**Total Tasks:** 10 | **Completed:** 10 | **Remaining:** 0

## Implementation Tasks

### Task 1: Navbar & Footer — Shared Layout Polish

**Objective:** Replace emoji icons with Lucide icons in Navbar, improve spacing and hover states in both Navbar and Footer. These are shared across all pages so they set the design tone.

**Dependencies:** None

**Files:**
- Modify: `components/Navbar.tsx`
- Modify: `components/Footer.tsx`

**Key Decisions / Notes:**
- Replace emoji nav icons with Lucide equivalents:
  - `Badminton/Booking` — use `Calendar` or `CalendarDays` icon
  - `Lessons` — use `BookOpen` icon
  - `Shop` — use `ShoppingBag` icon
  - `Leaderboard` — use `Trophy` icon
  - `Training Schedule` — use `GraduationCap` icon
  - `Teacher Dashboard` — use `ClipboardList` icon
  - `Updates` — use `Bell` or `Megaphone` icon
  - `Admin` — use `Settings` icon
- Improve nav link hover: add subtle background on hover (`hover:bg-accent rounded-md`)
- Footer: tighten vertical rhythm, ensure consistent text sizing
- Mobile menu: improve spacing between items, add subtle dividers

**Definition of Done:**
- [ ] All emoji icons in desktop and mobile nav replaced with Lucide SVG icons
- [ ] Nav link hover states have subtle background highlight
- [ ] Footer typography and spacing are visually consistent
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of Navbar on desktop and mobile
- Visual inspection of Footer

---

### Task 2: Homepage Hero + CourtStatus + About Sections

**Objective:** Polish the first three homepage sections — refine the Hero's text hierarchy and button styling, improve CourtStatus card spacing, and tighten the About section layout.

**Dependencies:** Task 1 (Navbar sets the visual tone)

**Files:**
- Modify: `components/home/HeroSection.tsx`
- Modify: `components/home/CourtStatusSection.tsx`
- Modify: `components/home/AboutSection.tsx`

**Key Decisions / Notes:**
- Hero: Refine text sizes for better hierarchy, ensure CTA buttons have consistent sizing with rounded-full style, improve the value prop strip at bottom
- CourtStatus: Better card padding, slightly larger status dots, improve the section title area
- About: Improve feature card padding/gaps, ensure stats grid has consistent sizing, refine the decorative accent behind the image

**Definition of Done:**
- [ ] Hero text hierarchy is clear (title > subtitle > body)
- [ ] CourtStatus cards have improved spacing
- [ ] About section feature cards and stats are visually polished
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of homepage (scroll through first 3 sections)

---

### Task 3: Homepage Sports + Pricing + Reviews Sections

**Objective:** Polish the middle three homepage sections — improve sport card image overlays, refine pricing card typography, and tighten the review masonry grid.

**Dependencies:** Task 2

**Files:**
- Modify: `components/home/SportsSection.tsx`
- Modify: `components/home/PricingSection.tsx`
- Modify: `components/home/ReviewsSection.tsx`

**Key Decisions / Notes:**
- Sports: Improve highlight pill styling, ensure image hover zoom is smooth, refine the floating price/courts badges
- Pricing: Improve the popular card styling, refine feature list spacing, ensure CTA buttons are consistent
- Reviews: Improve the Google rating summary card, refine review card quote icon and author section styling

**Definition of Done:**
- [ ] Sport cards have polished image overlays and badge positioning
- [ ] Pricing cards have refined typography hierarchy
- [ ] Review cards have improved quote/author styling
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of homepage (scroll through middle sections)

---

### Task 4: Homepage Stringing + Shop + Location Sections

**Objective:** Polish the final three homepage sections — refine the stringing promo's dark overlay styling, improve the shop category grid, and tighten the location section info cards and map.

**Dependencies:** Task 3

**Files:**
- Modify: `components/home/StringingSection.tsx`
- Modify: `components/home/ShopSection.tsx`
- Modify: `components/home/LocationSection.tsx`

**Key Decisions / Notes:**
- Stringing: Improve feature pill spacing, refine CTA button styling for dark background context
- Shop: Improve category card overlay gradients, refine the text + CTA layout on the left side
- Location: Improve info card icon alignment, refine the map container border radius and shadow

**Definition of Done:**
- [ ] Stringing section has polished feature pills and CTA
- [ ] Shop section category cards have improved overlays
- [ ] Location info cards and map are visually polished
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of homepage (scroll to bottom sections)

---

### Task 5: Booking Page Restyle

**Objective:** Polish the booking page's visual appearance — improve calendar styling, slot grid spacing, payment form layout, and summary card. Restyle only, no structural changes.

**Dependencies:** Task 1 (consistent with Navbar styling)

**Files:**
- Modify: `app/booking/page.tsx`

**Key Decisions / Notes:**
- This is a 1619-line file — only change Tailwind CSS classes, never touch JS logic
- Improve the step-by-step flow visual hierarchy (date selection → slot selection → payment)
- Better calendar container styling
- Improve the slot grid: better card spacing, clearer available/unavailable/selected states
- Polish the booking summary sidebar
- Improve the payment section card styling
- Ensure the receipt upload dialog is polished
- Focus on spacing consistency: `gap-4` → `gap-6` where cramped, `p-4` → `p-6` for cards

**Definition of Done:**
- [ ] Calendar section has improved visual hierarchy
- [ ] Slot grid has clear available/selected/unavailable states
- [ ] Payment section is visually polished
- [ ] Booking summary card has refined typography
- [ ] No TypeScript errors
- [ ] Booking flow still works end-to-end (no JS changes)
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of booking flow on desktop and mobile

---

### Task 6: Lessons Page Restyle

**Objective:** Polish the lessons page — improve the hero section typography, refine lesson card spacing and pricing display, and polish the coach credentials section.

**Dependencies:** Task 1

**Files:**
- Modify: `app/lessons/page.tsx`

**Key Decisions / Notes:**
- Hero section: refine heading sizes for consistency with homepage hero style
- Lesson cards: improve the price display hierarchy, better spacing between elements, ensure "Popular" badge is visually prominent
- Coach section: improve the circular image styling, refine the credential cards
- "What's Included" section: better card padding and icon sizing
- Trial form section: ensure consistent spacing

**Definition of Done:**
- [ ] Lesson cards have polished pricing display and spacing
- [ ] Coach section has refined visual hierarchy
- [ ] Feature cards have improved padding
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of lessons page

---

### Task 7: Leaderboard Page Restyle

**Objective:** Polish the leaderboard page — improve the podium visual design, refine the ranking list, and improve the month picker area.

**Dependencies:** Task 1

**Files:**
- Modify: `app/leaderboard/page.tsx`

**Key Decisions / Notes:**
- Podium: improve the background blocks (currently using plain colored divs), add subtle border radius and better sizing proportions
- Avatar fallbacks: improve the initial-letter circles with better sizing and font weight
- Month picker: improve the layout and input styling
- List view (4th+): improve row hover states, add subtle dividers
- Members-only locked state: improve the empty state styling

**Definition of Done:**
- [ ] Podium section has visually improved blocks with better proportions
- [ ] Month picker area is cleaner
- [ ] Ranking list has refined row styling
- [ ] Members-only lock screen is polished
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of leaderboard page

---

### Task 8: Shop Page + ShopHero Restyle

**Objective:** Polish the shop page — improve the hero gradient, refine the filter/sort controls, and improve the product grid spacing.

**Dependencies:** Task 1

**Files:**
- Modify: `app/shop/page.tsx`
- Modify: `components/shop/ShopHero.tsx`

**Key Decisions / Notes:**
- ShopHero: improve the gradient background, refine typography sizes
- Filter/sort bar: improve the sort toggle button styling, ensure the search/filter controls are consistent
- Product grid: improve loading skeleton styling, refine the "no products" empty state
- Category tabs (ShopCategoryTabs): not in scope unless import is trivial — focus on the main page file
- Preserve framer-motion parallax behavior in ShopHero

**Definition of Done:**
- [ ] ShopHero has improved gradient and typography
- [ ] Sort controls have refined button styling
- [ ] Product grid loading skeletons look polished
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of shop page

---

### Task 9: Dashboard + Profile + Member Dashboard Restyle

**Objective:** Polish the bookings dashboard, profile page tab navigation, and member training dashboard.

**Dependencies:** Task 1

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `components/member/MemberDashboard.tsx`

**Key Decisions / Notes:**
- Dashboard: improve booking card styling (`bg-secondary rounded-xl` → refine), better status badge colors for dark mode (current green-50/amber-50 are hardcoded and won't work in dark mode)
- Profile: improve the tab navigation styling, better avatar area, refine the sidebar/tab layout
- MemberDashboard: improve the overall card spacing and header area
- Dashboard status badges at `dashboard/page.tsx:84-103` use hardcoded colors like `bg-green-50`, `bg-amber-50`, `bg-red-50` — these need to be made theme-aware

**Definition of Done:**
- [ ] Dashboard booking cards are visually polished
- [ ] Dashboard status badges work in both light and dark mode
- [ ] Profile tab navigation is refined
- [ ] Member dashboard has improved spacing and cards
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of dashboard, profile, and training pages

---

### Task 10: Stringing + Updates + Auth Pages + LoadingScreen + StickyBookingCTA

**Objective:** Polish the remaining public pages — stringing flow, updates timeline, login/register forms, loading screen, and sticky CTA.

**Dependencies:** Task 1

**Files:**
- Modify: `app/stringing/page.tsx`
- Modify: `app/updates/page.tsx`
- Modify: `app/auth/login/page.tsx`
- Modify: `app/auth/register/page.tsx`
- Modify: `components/LoadingScreen.tsx`
- Modify: `components/StickyBookingCTA.tsx`

**Key Decisions / Notes:**
- Stringing: improve the string card layout, filter sheet styling, checkout flow cards
- Updates: refine the timeline visual (dots, connecting lines, entry cards)
- Auth pages: improve the form card styling, better input spacing, refine the card shadow/border
- LoadingScreen: subtle improvement to the spinner and text layout
- StickyBookingCTA: ensure the mobile bar has proper safe-area handling and refined styling

**Definition of Done:**
- [ ] Stringing page cards and filters are visually polished
- [ ] Updates timeline has refined visual hierarchy
- [ ] Auth forms have improved spacing and card styling
- [ ] LoadingScreen looks polished
- [ ] StickyBookingCTA has refined styling
- [ ] No TypeScript errors
- [ ] Both light and dark mode look correct

**Verify:**
- Visual inspection of stringing, updates, login, register pages

## Open Questions

None — all design decisions resolved.

## Deferred Ideas

- Booking page component extraction (identified as beneficial but deferred per user preference)
- Profile sub-tab component restyling (PersonalInfoTab, BookingsTab, etc.)
- Animated page transitions between routes
- Micro-interaction improvements (button press feedback, form validation animations)
