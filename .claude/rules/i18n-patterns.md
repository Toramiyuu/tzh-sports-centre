# Client-Side I18n Pattern

Client-side internationalization using `next-intl` with React Context.

## Core Files

- `lib/i18n.ts` - Types and constants
- `components/I18nProvider.tsx` - Context provider
- `messages/*.json` - Translations (en, ms, zh)

## Using i18n in Components

```typescript
import { useLocale } from '@/components/I18nProvider'
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('namespace')
  const { locale, setLocale } = useLocale()

  return (
    <div>
      <p>{t('key')}</p>
      <button onClick={() => setLocale('zh')}>中文</button>
    </div>
  )
}
```

## Locale Type

```typescript
import { Locale } from '@/lib/i18n'

type Locale = 'en' | 'ms' | 'zh'
```

## Persistence

- Cookie: `NEXT_LOCALE` (shared with server)
- localStorage: `locale` (fallback)
- 1 year expiry

## Adding New Translations

1. Add key to `messages/en.json`
2. Add translations to `messages/ms.json` and `messages/zh.json`
3. Access via `t('key')` in components

## Why Client-Side

Server-side i18n via middleware was removed (see app router structure). Client-side approach with Context provides:
- Immediate language switching without page reload
- State persistence across navigation
- Simpler integration with Next.js App Router
