import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'

import messages from '@/messages/en.json'

/**
 * Custom render function that wraps components in necessary providers
 */
export function render(
  ui: React.ReactElement,
  {
    locale = 'en',
    session = null,
    ...options
  }: {
    locale?: string
    session?: Parameters<typeof SessionProvider>[0]['session']
    [key: string]: unknown
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </SessionProvider>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
