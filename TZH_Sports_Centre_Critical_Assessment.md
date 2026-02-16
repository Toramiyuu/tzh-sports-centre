# Critical Assessment: TZH Sports Centre Website

**Prepared for:** TZH Sports Centre Development Team
**Date:** 15 February 2026
**Scope:** Full-stack assessment covering architecture, code quality, UI/UX, security, performance, accessibility, SEO, and internationalisation
**Codebase:** Next.js 16.1.1 / React 19.2.3 / PostgreSQL / Prisma ORM

---

## 1. Executive Summary

TZH Sports Centre is a full-featured sports facility management system serving badminton and pickleball players in Ayer Itam, Penang. The application handles court bookings, lesson scheduling, racket stringing services, merchandise browsing, and member/admin dashboards—all built on a modern Next.js App Router stack with TypeScript, Prisma, and PostgreSQL.

The codebase demonstrates strong architectural foundations: proper separation of concerns, centralised configuration, consistent API conventions, and a well-implemented dark mode and internationalisation system. However, several areas require attention before the platform can be considered fully production-hardened. The most pressing concerns are the absence of rate limiting on authentication endpoints, incomplete email verification flows, hardcoded credentials in source code, and client-side pricing that is not validated server-side. On the frontend, a handful of dark mode violations, oversized page components, and missing accessibility features reduce the polish of an otherwise well-designed interface.

This assessment provides findings rated by severity (Critical, High, Medium, Low) with actionable recommendations for each.

---

## 2. Technology Stack Assessment

### 2.1 Framework and Runtime

The project runs on **Next.js 16.1.1** with the App Router pattern and **React 19.2.3**, which are current releases. **Turbopack** is enabled for development builds, offering noticeably faster hot-module replacement than Webpack. TypeScript is used throughout with strict mode enabled, providing compile-time type safety across both frontend and backend code.

**Strengths:** The choice of Next.js App Router gives the project server components by default, reducing client-side JavaScript bundles. The unified TypeScript codebase means API routes and frontend pages share types, eliminating a class of integration bugs common in separate frontend/backend architectures.

**Concern:** NextAuth v5 is still on a beta release (beta.30). While functional, beta software carries the risk of breaking changes between versions and may lack security patches that stable releases receive.

### 2.2 Database Layer

PostgreSQL with **Prisma v5.22** provides the data layer. The schema contains 16 models and 2 enums across 433 lines, covering users, bookings, lessons, stringing orders, shop orders, recurring bookings, payment transactions, and racket profiles.

**Strengths:** Prisma's parameterised queries eliminate SQL injection risks entirely. The schema follows PostgreSQL naming conventions (snake_case columns via `@map()`) while maintaining TypeScript-friendly camelCase in the application layer. Soft deletes via `deletedAt` fields preserve audit trails. Compound unique constraints (e.g., `MonthlyPayment` on `[userId, month, year]`) enforce data integrity at the database level.

**Concern:** The Prisma singleton in `lib/prisma.ts` only caches the client instance in non-production environments. In production, this means a new `PrismaClient` is instantiated on every request, which can exhaust connection pools under load. The global caching should apply in all environments.

### 2.3 Authentication

**NextAuth v5** with a Credentials provider handles authentication. Users can log in with either email or phone number, and passwords are hashed with bcryptjs at 12 salt rounds. JWT tokens carry the user ID and `isAdmin` flag, and a middleware layer protects routes like `/dashboard`, `/profile`, and `/admin`.

**Strengths:** The dual email/phone login is well-suited to the Malaysian market where phone-based authentication is common. The admin check is abstracted into a helper function in `lib/admin.ts` that prevents the common mistake of reading `isAdmin` directly from the session object.

**Concerns:** The session `maxAge` is not explicitly configured, defaulting to 30 days—too long for an application handling financial transactions. A legacy hardcoded email list serves as a superadmin fallback, which is a security risk if the repository is ever exposed. These emails should be moved to the database or environment variables.

### 2.4 Payments

The platform supports **Stripe** for card, GrabPay, and FPX payments, alongside manual payment methods (Touch 'n Go and DuitNow) with receipt upload and admin verification.

**Strengths:** Stripe webhook signature verification is correctly implemented using `stripe.webhooks.constructEvent()`. The manual payment workflow with receipt upload is a practical approach for the Malaysian market. Stripe initialisation is conditional on the environment variable being set, meaning the app degrades gracefully without it.

**Concern:** The Stripe checkout amount is calculated from client-submitted `slotRate` values rather than server-side rate lookup. A user could submit modified rates and be charged less than the actual price. All pricing must be computed server-side.

---

## 3. Architecture and Code Quality

### 3.1 Directory Structure

The project follows a clean, feature-oriented structure. API routes live under `app/api/` organised by domain (bookings, shop, stringing, admin). React components are grouped into `ui/`, `admin/`, `shop/`, `profile/`, and `member/` directories. Business logic—lesson pricing, shop catalogue, stringing inventory, booking expiration—lives in dedicated files under `lib/`.

This separation makes it straightforward to locate code by feature, and new developers can orient themselves quickly. The 23-component `ui/` directory wrapping Radix UI primitives provides a consistent design system.

### 3.2 Configuration Centralisation

One of the codebase's strongest patterns is its centralised configuration. Lesson types, pricing tiers, billing modes, and duration rules are all defined in `lib/lesson-config.ts` (318 lines). The shop catalogue of 45+ products with categories, brands, and filtering logic lives in `lib/shop-config.ts` (762 lines). String inventory and racket models are in `lib/stringing-config.ts` (384 lines).

This means changing a price, adding a product, or modifying a lesson type requires editing a single file rather than hunting through multiple components and API routes. It is an excellent practice that many larger codebases fail to implement.

### 3.3 Validation Patterns

Input validation is centralised in `lib/validation.ts` with helpers for Malaysian phone numbers, emails, sport types, payment methods, future dates, and string tension. All helpers return the cleaned value or `null`, enabling consistent one-line validation checks across API routes.

**Issue:** The registration endpoint (`app/api/register/route.ts`) uses inline regex for phone and email validation instead of the shared helpers. Similarly, the admin account creation endpoint uses a simple length check for phone numbers rather than `validateMalaysianPhone()`. These inconsistencies should be corrected.

### 3.4 Error Handling

API routes consistently use try-catch blocks and return errors in a `{ error: 'message' }` format with appropriate HTTP status codes (400, 401, 403, 404, 409, 500). This is well-implemented. However, some error messages leak implementation details—for example, "This slot was just booked by someone else" reveals that a race condition occurred internally. Error messages should be user-friendly without exposing system behaviour.

### 3.5 Code Size

Several files have grown beyond comfortable maintainability. The homepage (`app/page.tsx`) spans roughly 785 lines, containing the hero section, about section, sports cards, pricing tables, reviews grid, stringing promotion, shop preview, and location map all in a single component. The booking page is similarly large. Breaking these into smaller, focused components would improve readability, testability, and reusability.

### 3.6 Test Coverage

There are no test files in the codebase. For a production application handling financial transactions, court reservations, and user data, this is a significant gap. At minimum, the booking conflict detection logic, payment processing, and authentication flows should have automated tests. The complex monthly billing calculations in `recurring-booking-utils.ts` are particularly error-prone without test coverage.

---

## 4. Frontend and UI/UX Assessment

### 4.1 Visual Design

The landing page is well-crafted with a layered hero section, clear section hierarchy, and consistent use of card components with hover effects. Framer Motion animations add polish to section transitions. The masonry-style reviews grid using CSS columns is visually effective. The colour palette—a lavender-blue light theme transitioning to a navy dark theme—feels professional and appropriate for a sports facility.

The admin dashboard uses a card-based layout for navigation to sub-sections (bookings, members, stringing, shop). This is functional but somewhat generic. The data-heavy admin views (booking grids, member tables) use proper table layouts with hidden columns on smaller screens.

### 4.2 Dark Mode

The dark mode implementation uses CSS custom properties in `globals.css` with `next-themes` for persistence, which is the correct approach. Most components correctly reference theme-aware classes like `bg-card`, `text-foreground`, and `border-border`.

**Violations found:**

- `components/ui/skeleton.tsx` uses `bg-gray-200` and `bg-white`—hardcoded values that render poorly in dark mode. These should be `bg-muted` and `bg-card` respectively.
- `app/admin/page.tsx` uses `bg-blue-100`, `bg-violet-100`, `bg-teal-100`, and `bg-amber-100` for feature card accents. These Tailwind colour utilities do not adapt to the dark theme and should be replaced with opacity variants of the theme's primary colour (e.g., `bg-primary/10`).

These are isolated violations but they break the visual consistency that the rest of the application maintains.

### 4.3 Responsive Design

The application uses a mobile-first approach with Tailwind breakpoints. Navigation collapses to a hamburger menu on small screens. Grid layouts scale from 1 column on mobile to 2–4 columns on larger screens. Typography scales appropriately with responsive size classes.

**Concerns:** Admin data tables hide columns on mobile but do not provide an alternative compact view or card-based layout for the hidden data. The booking page's multi-step form is a long scrollable page on mobile without clear progress indication. Touch targets for some interactive elements may be smaller than the recommended 44×44px minimum.

### 4.4 Loading States and Feedback

The application includes a custom `LoadingScreen` component with an animated logo, skeleton loaders for cards and tables, and Sonner toast notifications for success/error/warning feedback. This covers the main interaction patterns well.

**Gaps:** There is limited progressive loading feedback during multi-step flows like the booking process. When API calls fail, the error feedback is a generic toast without guidance on what the user should do next. Suspense boundaries exist but no visible fallback UI is configured for them.

### 4.5 Component Reusability

The component library is well-organised. Radix UI primitives are wrapped in `components/ui/` with `class-variance-authority` for managing variants. Domain-specific components (product cards, booking dialogs, admin content panels) are properly abstracted.

**Issue:** Some computed values and data transformations are defined inline within page components rather than extracted to utility functions. For example, the `mapDbProduct()` function in the shop page could be a shared utility. Booking rates are defined as constants within components rather than imported from a central configuration.

---

## 5. Security Assessment

### 5.1 Critical Findings

**5.1.1 No Rate Limiting**
No rate limiting is implemented on any endpoint. The registration endpoint, login endpoint, and booking creation endpoint are all accessible without request frequency constraints. This allows brute-force attacks on passwords, account enumeration through registration attempts, and denial-of-service through repeated booking requests. Rate limiting should be implemented at minimum on authentication endpoints (5 requests per minute) and booking endpoints (30 per minute).

**5.1.2 Client-Side Price Calculation Sent to Stripe**
The Stripe checkout endpoint (`/api/payments/create-checkout`) sums the `slotRate` values provided by the client to determine the payment amount. An attacker could modify these values before submission to pay less than the actual court rate. The server must look up court rates from its own configuration and calculate the total independently.

**5.1.3 Default Password in Source Code**
The admin user creation endpoint contains `const DEFAULT_PASSWORD = 'temp1234'` and returns this password in the API response body. Hardcoded credentials in source code are a well-known vulnerability. If the repository is compromised, this password is exposed. Furthermore, returning passwords in API responses means they appear in network logs and browser developer tools. The system should use single-use password reset links instead.

**5.1.4 Incomplete Email Verification**
The profile update endpoint stores an email verification token when a user changes their email address, but the comment "TODO: Send verification email" indicates the verification flow is not implemented. Without email verification, a user can change their email to any unused address without confirming ownership, which could facilitate account impersonation.

### 5.2 High Findings

**5.2.1 Hardcoded Admin Emails**
Three email addresses are hardcoded in `lib/admin.ts` as a superadmin fallback. While this provides a safety net against admin lockout, it means anyone with repository access knows the admin accounts. These should be stored in the database or as environment variables.

**5.2.2 Missing Security Headers**
There is no evidence of security headers such as `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, or `Content-Security-Policy` being set in `next.config.ts` or middleware. These headers protect against clickjacking, MIME-type sniffing, and protocol downgrade attacks. Vercel may provide some of these by default, but they should be explicitly configured.

**5.2.3 No Audit Logging for Admin Actions**
Admin actions—approving payments, deleting users, resetting passwords, modifying bookings—are not logged to an audit table. Without an audit trail, it is impossible to investigate suspicious admin activity or demonstrate compliance with data handling requirements.

**5.2.4 Open Redirect via Callback URL**
The middleware sets `loginUrl.searchParams.set('callbackUrl', pathname)` without validating that the pathname is a relative URL. An attacker could craft a URL that redirects the user to an external site after login. Callback URLs should be validated against a whitelist of internal paths.

### 5.3 Medium Findings

**5.3.1 No Request Body Size Limits**
Large JSON payloads could consume server memory. Next.js defaults should be reviewed and explicit body size limits set (e.g., 1MB for standard endpoints, 5MB for file uploads).

**5.3.2 No XSS Sanitisation on Stored Input**
Guest names, notes, and other free-text fields are stored directly in the database without sanitisation. While React escapes output by default, any context where these values are rendered outside React (emails, PDF receipts, admin exports) could be vulnerable to stored XSS. Input sanitisation at the API layer provides defence in depth.

**5.3.3 Long Default Session Lifetime**
The NextAuth session defaults to 30 days without explicit configuration. For an application processing payments and personal data, an 8-hour session with refresh tokens would be more appropriate.

**5.3.4 No Failed Login Logging**
Failed authentication attempts return `null` silently without logging. Without visibility into failed login patterns, brute-force attacks cannot be detected even if rate limiting is later added.

---

## 6. Performance Assessment

### 6.1 Strengths

The application demonstrates several good performance practices. The `lib/cache.ts` module implements a simple TTL-based in-memory cache for court data and time slots, reducing database queries. API routes use `Promise.all` for parallel database queries where results are independent. Next.js Image components are used throughout with `priority` loading for above-the-fold images and `fill` with `object-cover` for responsive backgrounds. `useCallback` is used appropriately across components (59 occurrences found) for function memoisation.

### 6.2 Concerns

**6.2.1 Prisma Client Instantiation in Production**
As noted in Section 2.2, the Prisma singleton only caches in non-production environments. In production, each request creates a new PrismaClient, which opens new database connections. Under concurrent load, this will exhaust the PostgreSQL connection pool and cause request failures.

**6.2.2 Missing React.memo and useMemo**
Expensive components (product grids, booking calendars, admin tables) are not wrapped in `React.memo`. Computed values like filtered product lists are recalculated on every render rather than memoised with `useMemo`. While React 19's compiler optimisations mitigate some of this, explicit memoisation for demonstrably expensive computations remains a best practice.

**6.2.3 Bundle Size**
The application loads Framer Motion, Stripe.js, and multiple Radix UI components. While each is justified by the features they enable, the combined impact on initial page load should be measured. Code splitting via dynamic imports is used in some places (e.g., `lazy()` for the stringing page) but could be applied more broadly to admin-only components that regular users never load.

**6.2.4 No Image Sizes Attribute**
Responsive `Image` components do not specify a `sizes` attribute, which means the browser cannot select the optimal image size from the `srcset` before layout. Adding `sizes` based on the component's responsive breakpoints would reduce unnecessary image data transfer.

---

## 7. Accessibility Assessment

### 7.1 Strengths

The application has a reasonable accessibility baseline. Radix UI components provide built-in ARIA attributes and keyboard navigation for dialogs, dropdowns, and tooltips. ARIA labels are applied to icon-only buttons (theme toggle, hamburger menu, WhatsApp link). Form inputs have associated `<Label>` components with proper `htmlFor` attributes. Semantic HTML elements (`<main>`, `<nav>`, `<footer>`) are used correctly. Focus-visible styles are defined in the button component using `focus-visible:border-ring`.

### 7.2 Gaps

**7.2.1 No Skip Navigation Link**
There is no "Skip to main content" link at the top of the page. Users navigating with a keyboard or screen reader must tab through the entire navigation bar on every page load before reaching the main content. This is a WCAG 2.1 Level A requirement.

**7.2.2 Colour Contrast**
Some muted text on light backgrounds (e.g., `text-muted-foreground` on `bg-background`) may not meet the WCAG AA contrast ratio of 4.5:1 for normal text. The muted foreground colour (#64748b light / #94a3b8 dark) against the respective backgrounds should be tested with a contrast checker.

**7.2.3 Reduced Motion**
While `@media (prefers-reduced-motion)` exists in the CSS for basic transitions, the Framer Motion animations on the homepage and booking pages do not check for this preference. Users with vestibular disorders may find the slide-in and fade animations disorienting. Framer Motion's `useReducedMotion` hook should be applied.

**7.2.4 Heading Hierarchy**
Some pages may have inconsistent heading levels (jumping from `h1` to `h3` without an `h2`). Screen readers use heading hierarchy to build a page outline, and gaps in the hierarchy make navigation more difficult.

**7.2.5 Alt Text**
While most images use the Next.js `Image` component with `alt` attributes, some decorative images use generic descriptions ("Sports Centre") rather than meaningful text. Product images should describe the product being shown.

---

## 8. SEO and Metadata

### 8.1 Strengths

The root layout includes comprehensive metadata: an OpenGraph image, Twitter card configuration, and JSON-LD structured data for a `SportsActivityLocation`. The title template (`%s | TZH Sports Centre`) ensures consistent branding across pages. A sitemap is configured.

### 8.2 Gaps

Not all pages define custom metadata. Product pages, lesson pages, and booking confirmation pages should have page-specific titles, descriptions, and OpenGraph data. The JSON-LD structured data could be expanded to include `Event` schema for lessons and `Product` schema for shop items, improving visibility in Google's rich results.

---

## 9. Internationalisation

### 9.1 Implementation

The application supports three languages—English, Chinese (ZH), and Malay (MS)—via `next-intl`. Translation files live in `messages/` as JSON files with hierarchical keys. Server components use `getTranslations()` and client components use `useTranslations()`. Middleware handles locale detection and URL prefixing.

### 9.2 Concerns

Some hardcoded English text exists in the codebase outside of translation files—for instance, "Open now until 12:00 AM" in the hero section. Business-specific strings (court names, payment method labels) should also be internationalised. Date and currency formatting should use locale-aware formatters rather than manual string construction.

---

## 10. Business Logic Assessment

### 10.1 Booking System

The booking system handles conflict detection across three sources: regular bookings, recurring bookings, and lesson sessions. Time overlap detection is implemented correctly, and race conditions are handled via Prisma unique constraints with retry logic. The 48-hour expiration system with warning emails is a practical approach to reducing no-shows.

**Concern:** There is no maximum future booking date. A user could reserve courts months in advance, blocking legitimate near-term bookings. A 90-day rolling window is standard for facilities of this type.

### 10.2 Pricing

Pricing is well-structured with off-peak/peak rates for badminton (RM7.50/RM9.00 per 30 minutes) and flat rates for pickleball (RM12.50 per 30 minutes). Dynamic pricing for bookings that span the peak boundary (6PM) is handled correctly. Lesson pricing supports 8 different types with per-session and per-person calculations.

### 10.3 Recurring Bookings

Monthly recurring bookings with pro-rated mid-month pricing and a 4-session-per-month limit are implemented with proper edge case handling (skipping the 5th weekday occurrence). The compound unique index on `[userId, month, year]` for payment records prevents duplicates. This is complex logic that is well-managed but would benefit greatly from unit tests.

---

## 11. Recommendations Summary

### Critical Priority (Address Before Production)

1. **Implement rate limiting** on authentication, registration, and booking endpoints
2. **Validate Stripe checkout amounts server-side** by computing prices from server configuration, not client input
3. **Remove hardcoded default passwords** from source code; implement password reset links
4. **Complete email verification flow** for email address changes
5. **Fix Prisma singleton** to cache the client instance in all environments

### High Priority

6. **Move hardcoded admin emails** to database or environment variables
7. **Add security headers** (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)
8. **Implement admin audit logging** for all sensitive operations
9. **Validate callback URLs** in the authentication middleware
10. **Add automated tests** for booking conflict detection, payment processing, and authentication

### Medium Priority

11. **Fix dark mode violations** in skeleton component and admin page
12. **Reduce session lifetime** to 8 hours with refresh mechanism
13. **Add input sanitisation** for free-text fields at the API layer
14. **Set request body size limits** in Next.js configuration
15. **Use consistent validation helpers** in registration and admin account creation endpoints
16. **Break large page components** (homepage, booking page) into smaller focused components
17. **Log failed authentication attempts** for security monitoring

### Low Priority

18. **Add skip navigation link** for keyboard accessibility
19. **Test colour contrast ratios** against WCAG AA standards
20. **Implement `useReducedMotion`** for Framer Motion animations
21. **Add `sizes` attribute** to responsive Image components
22. **Apply `React.memo` and `useMemo`** to expensive components and computations
23. **Expand JSON-LD structured data** for products and lessons
24. **Internationalise remaining hardcoded strings**
25. **Set maximum booking date** to a 90-day rolling window

---

## 12. Conclusion

TZH Sports Centre is a well-architected, feature-rich application that demonstrates strong technical decision-making in its choice of stack, database design, and business logic implementation. The centralised configuration pattern, consistent API conventions, and thorough dark mode system are particularly commendable.

The primary risks are in the security domain: the absence of rate limiting, client-side pricing sent to Stripe, and incomplete verification flows are the most urgent items to address. On the frontend, the dark mode violations are isolated and easily fixed, while the accessibility gaps are common in projects at this stage and can be addressed incrementally.

With the critical and high-priority recommendations implemented, the platform would be well-positioned for production deployment serving the sports centre's members, casual players, and administrative staff.

---

*Assessment conducted on 15 February 2026 based on the codebase at 99 commits.*
