---
name: create-layout
description: Create a Next.js layout with providers, metadata, fonts, and error boundaries
---

# Create Layout

Creates a Next.js layout with proper provider nesting, metadata, font configuration, and error boundaries.

## Usage
```
/create-layout [root|locale|section]
```

## Instructions

### 1. Root Layout
```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/app/globals.css';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'App Name', template: '%s | App Name' },
  description: 'App description',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Locale Layout (with next-intl)
```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

## Validation Checklist
- [ ] Font loaded with next/font (no external stylesheet)
- [ ] Metadata configured with template pattern
- [ ] Providers nested in correct order
- [ ] Children rendered (never forgotten)
