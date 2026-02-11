import type { Metadata } from 'next'
import { Geist, Geist_Mono, Outfit } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SessionProvider } from '@/components/SessionProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { LoadingScreen } from '@/components/LoadingScreen'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://tzh-sports-centre.vercel.app'),
  manifest: '/manifest.json',
  title: {
    default: 'TZH Sports Centre - Badminton & Pickleball Courts in Ayer Itam, Penang',
    template: '%s | TZH Sports Centre',
  },
  description: 'Book badminton and pickleball courts online at TZH Sports Centre, Ayer Itam, Penang. 4 professional courts from RM15/hr. Coaching, stringing services & walk-ins welcome.',
  keywords: ['badminton court', 'pickleball court', 'Ayer Itam', 'Penang', 'court booking', 'badminton lessons', 'racket stringing', 'TZH Sports Centre'],
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: 'https://tzh-sports-centre.vercel.app',
    siteName: 'TZH Sports Centre',
    title: 'TZH Sports Centre - Badminton & Pickleball Courts in Penang',
    description: 'Book badminton and pickleball courts online from RM15/hr. Professional coaching & racket stringing in Ayer Itam, Penang.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'TZH Sports Centre - Badminton Courts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TZH Sports Centre - Badminton & Pickleball Courts in Penang',
    description: 'Book courts online from RM15/hr. Professional coaching & stringing in Ayer Itam.',
    images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsActivityLocation',
              name: 'TZH Sports Centre',
              description: 'Badminton and pickleball courts available for booking in Ayer Itam, Penang. Professional coaching and racket stringing services.',
              url: 'https://tzh-sports-centre.vercel.app',
              telephone: '+60116868508',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Jalan Sekolah La Salle',
                addressLocality: 'Ayer Itam',
                addressRegion: 'Penang',
                postalCode: '11400',
                addressCountry: 'MY',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 5.4090748,
                longitude: 100.29758,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                  opens: '15:00',
                  closes: '00:00',
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Saturday', 'Sunday'],
                  opens: '09:00',
                  closes: '00:00',
                },
              ],
              priceRange: 'RM15 - RM25 per hour',
              sport: ['Badminton', 'Pickleball'],
              amenityFeature: [
                { '@type': 'LocationFeatureSpecification', name: 'Court Rental', value: true },
                { '@type': 'LocationFeatureSpecification', name: 'Coaching', value: true },
                { '@type': 'LocationFeatureSpecification', name: 'Racket Stringing', value: true },
                { '@type': 'LocationFeatureSpecification', name: 'Food & Beverages', value: true },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <I18nProvider>
            <SessionProvider>
                <LoadingScreen />
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    duration: 4000,
                    className: 'font-sans',
                  }}
                />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <WhatsAppButton />
            </SessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
