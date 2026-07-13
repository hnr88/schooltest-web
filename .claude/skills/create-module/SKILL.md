---
name: create-module
description: Scaffold a complete feature module with standardized folder structure
---

# Create Feature Module

Scaffolds a complete feature module following the module pattern with all standard subdirectories.

## Usage
```
/create-module [module-name]
```

Example: `/create-module users` creates `src/modules/users/`

## Instructions

### 1. Create Module Structure
Create directories: `src/modules/[module-name]/`

```
src/modules/[module-name]/
├── components/          # React components
│   ├── [Component].jsx
│   └── [Component].jsx
├── hooks/              # Custom hooks
│   ├── use[Hook].js
│   └── use[Hook].js
├── lib/                # Utility functions
│   ├── utils.js
│   └── constants.js
├── constants/          # Module constants
│   └── index.js
├── store/              # Zustand store (if needed)
│   └── [name]-store.js
└── index.js            # Module entry point
```

### 2. Create Module Entry Point
File: `src/modules/[module-name]/index.js`

```js
// Components
export { ComponentName } from './components/ComponentName';

// Hooks
export { useHookName } from './hooks/useHookName';

// Store
export { useModuleStore } from './store/module-store';

// Utils
export { utilityFunction } from './lib/utils';

// Constants
export { MODULE_CONSTANTS } from './constants';
```

### 3. Create Components Subdirectory
File: `src/modules/[module-name]/components/ExampleComponent.jsx`

```jsx
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ExampleComponent({ children, className = '' }) {
  const t = useTranslations('ModuleName');

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-bold">{t('title')}</h2>
      {children}
    </div>
  );
}
```

### 4. Create Hooks Subdirectory
File: `src/modules/[module-name]/hooks/useModuleData.js`

```jsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useModuleData(id) {
  return useQuery({
    queryKey: ['module', id],
    queryFn: () =>
      apiClient.get(`/api/module/${id}`).then((res) => res.data),
    enabled: !!id,
  });
}
```

### 5. Create Constants Subdirectory
File: `src/modules/[module-name]/constants/index.js`

```js
export const MODULE_CONSTANTS = {
  MAX_ITEMS: 100,
  CACHE_TIME: 5 * 60 * 1000,
  DEFAULT_PAGE_SIZE: 20,
};

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};
```

### 6. Create Lib Utilities Subdirectory
File: `src/modules/[module-name]/lib/utils.js`

```js
export function formatModuleData(data) {
  return {
    ...data,
    formatted: true,
    timestamp: new Date(),
  };
}

export function validateModuleInput(input) {
  return typeof input === 'object' && input !== null;
}
```

### 7. Optional: Create Zustand Store
File: `src/modules/[module-name]/store/module-store.js`

```js
import { create } from 'zustand';

export const useModuleStore = create((set) => ({
  isOpen: false,
  selectedItem: null,
  setIsOpen: (open) => set({ isOpen: open }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  reset: () => set({ isOpen: false, selectedItem: null }),
}));
```

### 8. Add Translations
Create translation entries in `src/i18n/messages/en.json`:

```json
{
  "ModuleName": {
    "title": "Module Title",
    "description": "Module description",
    "action": "Take Action",
    "error": "An error occurred"
  }
}
```

Add to all locale files:
- `zh-Hans.json`
- `vi.json`
- `ne.json`

### 9. Validation Checklist
- [ ] Module created at `src/modules/[module-name]/`
- [ ] `components/`, `hooks/`, `lib/`, `constants/` directories exist
- [ ] `index.js` exports all public APIs
- [ ] All components use `'use client'` if needed
- [ ] All hooks follow `use*` naming convention
- [ ] Constants in `UPPER_SNAKE_CASE`
- [ ] Imports use `@/` prefix
- [ ] Translations added for all locales
- [ ] Files under 120 lines each

## Usage in Pages
```jsx
import { ExampleComponent, useModuleData } from '@/modules/[module-name]';

export default function Page() {
  const { data } = useModuleData();
  return <ExampleComponent>{data}</ExampleComponent>;
}
```

## Do NOT
- ❌ Create components/hooks outside module structure
- ❌ Use relative imports between modules
- ❌ Export from non-existent files in index.js
- ❌ Skip the constants directory
- ❌ Create inconsistent naming conventions
