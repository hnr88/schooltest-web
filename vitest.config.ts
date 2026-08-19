import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    // The client validates its env at import time (src/lib/env.ts). Next inlines
    // NEXT_PUBLIC_* in a real build; under vitest there is none, so provide dummy
    // URLs for every test before any module imports @/lib/env.
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:1337',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
    // Node >= 26 shadows jsdom's `localStorage` with an undefined global; the
    // stub puts a working in-memory Storage back (schooltest-app precedent).
    setupFiles: ['./vitest-stubs/local-storage.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'out', 'dist', 'build', 'tests/e2e/**'],
    // Inline next-intl so Vite transforms it and the `next/navigation` alias
    // applies inside it (externalized node_modules bypass resolve.alias).
    server: { deps: { inline: ['next-intl'] } },
  },
  resolve: {
    alias: {
      // `next/navigation` has no implementation outside a Next build; stub it so
      // next-intl navigation / the auth-store redirect resolve under vitest.
      'next/navigation': fileURLToPath(new URL('./vitest-stubs/next-navigation.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});