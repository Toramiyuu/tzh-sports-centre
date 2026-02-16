# Project: TZH Sports Centre

**Last Updated:** 2026-02-16

## Overview

Sports centre booking management system for badminton and pickleball. Handles court bookings, lessons, stringing services, merchandise shop, and member management with admin dashboard.

## Technology Stack

- **Language:** TypeScript
- **Framework:** Next.js 16.1.1 (App Router)
- **Runtime:** React 19.2.3
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v5 (beta.30)
- **Styling:** Tailwind CSS v4 + Radix UI components
- **I18n:** next-intl (EN, ZH, MS)
- **Payments:** Stripe integration
- **File Storage:** Vercel Blob
- **Build Tool:** Next.js with Turbopack
- **Package Manager:** npm

## Directory Structure

```
TzhSportsCentre/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── admin/        # Admin endpoints
│   │   ├── auth/         # NextAuth handlers
│   │   ├── bookings/     # Booking management
│   │   ├── shop/         # E-commerce
│   │   └── stringing/    # Stringing service
│   ├── admin/            # Admin dashboard pages
│   ├── auth/             # Login/register pages
│   ├── booking/          # Booking flow
│   ├── shop/             # Shop pages
│   └── page.tsx          # Homepage
├── components/           # React components
│   ├── admin/           # Admin-specific components
│   ├── profile/         # User profile components
│   ├── shop/            # Shop components
│   └── ui/              # Radix UI components (shadcn)
├── lib/                 # Utilities
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Prisma client
│   └── validation.ts    # Input validation helpers
├── prisma/              # Database
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Database seeding
│   └── migrations/      # Schema migrations
├── public/              # Static assets
├── messages/            # i18n translations (en.json, zh.json, ms.json)
└── types/               # TypeScript types
```

## Key Files

- **Configuration:** `prisma/schema.prisma`, `tailwind.config.ts`, `next.config.ts`
- **Entry Point:** `app/layout.tsx`, `app/page.tsx`
- **Auth:** `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- **Database:** `lib/prisma.ts`, `prisma/schema.prisma`
- **Validation:** `lib/validation.ts`
- **Tests:** None configured yet

## Development Commands

- **Install:** `npm install`
- **Dev Server:** `npm run dev` (runs on http://localhost:3000)
- **Build:** `npm run build` (runs `prisma generate` first)
- **Start Production:** `npm start`
- **Lint:** `npm run lint`
- **DB Seed:** `npm run db:seed`
- **Prisma Studio:** `npx prisma studio`
- **Prisma Migrate:** `npx prisma migrate dev`

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - App URL (e.g., http://localhost:3000)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `SMTP_*` - Email configuration (optional)

## Architecture Notes

**Authentication:**
- NextAuth v5 with Credentials provider
- Supports login via email OR phone
- Session-based auth with JWT
- Role-based access: `isAdmin`, `isMember`

**Database:**
- Prisma ORM with PostgreSQL
- Main entities: User, Court, Booking, LessonRequest, StringingOrder, ShopOrder
- Soft deletes via `deletedAt` field
- Credit balance system for members

**Payment Flow:**
- Malaysian payment methods: TnG (Touch 'n Go), DuitNow
- Manual approval workflow (receipt upload)
- Stripe integration for shop purchases

**Sports Supported:**
- Badminton (RM7.50/30min, RM9/30min peak after 6PM, 1hr minimum)
- Pickleball (RM12.50/30min, 2hr minimum)

**Internationalization:**
- English, Chinese (ZH), Malay (MS)
- Translations in `messages/*.json`
- next-intl middleware

**API Conventions:**
- API routes in `app/api/`
- NextAuth session via `auth()` helper
- Validation helpers in `lib/validation.ts`
- Consistent error responses
