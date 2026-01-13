import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SessionProvider } from '@/components/SessionProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TZH Badminton - Book Your Court',
  description: 'Book badminton courts online at TZH Badminton. 4 professional courts available daily from 9 AM to 12 AM.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <I18nProvider>
          <SessionProvider>
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
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
