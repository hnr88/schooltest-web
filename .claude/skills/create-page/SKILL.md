---
name: create-page
description: Create a new Next.js App Router page with locale support and Server/Client Component decision
---

# Create Next.js Page

Creates a properly structured page in the Next.js 16 App Router with full internationalization support using next-intl.

## Usage
```
/create-page [page-path] [--client] [--with-form] [--with-query]
```

## Instructions

### 1. Determine Page Type
- **Server Component (default)**: For pages that fetch data, use translations, or don't need interactivity
- **Client Component (`--client`)**: Only for interactive pages with hooks like useState, useReducer, useContext

### 2. Create Page File
Place file at: `src/app/[locale]/[page-path]/page.jsx`

**Server Component Template:**
```jsx
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Page Title',
};

export default async function Page() {
  const t = await getTranslations('PageNamespace');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-gray-600 mt-2">{t('description')}</p>
    </div>
  );
}
```

**Client Component Template (if `--client`):**
```jsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function Page() {
  const t = useTranslations('PageNamespace');
  const [state, setState] = useState(null);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
    </div>
  );
}
```

### 3. Add Translations
Add to `src/i18n/messages/en.json`:
```json
{
  "PageNamespace": {
    "title": "Page Title",
    "description": "Page description"
  }
}
```

Also add matching keys to:
- `src/i18n/messages/zh-Hans.json`
- `src/i18n/messages/vi.json`
- `src/i18n/messages/ne.json`

### 4. Import Module Components
For interactive elements, use components from modules:
```jsx
import { Header } from '@/modules/core/components';
import { useUserData } from '@/modules/users/hooks';
```

### 5. Validation Checklist
- [ ] File is at `src/app/[locale]/[page-path]/page.jsx`
- [ ] Server or Client component correctly chosen
- [ ] Uses `getTranslations()` (server) or `useTranslations()` (client)
- [ ] All imports use `@/` prefix (no relative imports)
- [ ] Translation keys exist in all 4 locale files
- [ ] No styling outside Tailwind classes
- [ ] File is under 120 lines

## Common Patterns

### Page with Module Components
```jsx
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/modules/users/components';

export default async function UsersPage() {
  const t = await getTranslations('Users');

  return (
    <div className="space-y-6">
      <h1>{t('title')}</h1>
      <UserCard />
    </div>
  );
}
```

### Dynamic Route Page
```jsx
// src/app/[locale]/items/[id]/page.jsx
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }];
}

export default async function ItemPage({ params }) {
  const { id } = await params;
  return <div>Item: {id}</div>;
}
```

## Do NOT
- ❌ Use relative imports (`../pages/`)
- ❌ Mix Server and Client logic without boundary
- ❌ Add styles outside `globals.css` or Tailwind
- ❌ Create components directly in pages (use modules)
- ❌ Forget to add translations for all locales
