import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [['__tests__/components/**', 'jsdom']],
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: [
        'lib/prisma.ts',
        'lib/confetti.ts',
        'lib/i18n.ts',
        'lib/update-log.ts',
        'lib/auth.ts',
        'app/api/chat/**',
        'app/api/receipt/**',
        'app/api/auth/**',
        'app/api/cron/**',
        'app/api/upload/**',
      ],
      thresholds: {
        'lib/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
