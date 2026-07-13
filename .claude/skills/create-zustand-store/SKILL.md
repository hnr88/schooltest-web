---
name: create-zustand-store
description: Create a Zustand store with typed actions and selectors
---

# Create Zustand Store

Creates a client-side state management store using Zustand with proper typing and selector patterns.

## Usage
```
/create-zustand-store [store-name]
```

Example: `/create-zustand-store modal`

## Instructions

### 1. Basic Zustand Store
File: `src/modules/[module]/store/modal-store.js`

```jsx
import { create } from 'zustand';

export const useModalStore = create((set) => ({
  isOpen: false,
  modalType: null,

  openModal: (type) =>
    set({ isOpen: true, modalType: type }),

  closeModal: () =>
    set({ isOpen: false, modalType: null }),

  toggleModal: () =>
    set((state) => ({ isOpen: !state.isOpen })),
}));
```

### 2. Store with Complex State
File: `src/modules/[module]/store/ui-store.js`

```jsx
import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // State
  sidebarOpen: true,
  theme: 'light',
  notifications: [],

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (theme) => set({ theme }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now(), ...notification },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () =>
    set({ notifications: [] }),

  // Selectors
  getNotificationCount: () => get().notifications.length,

  reset: () =>
    set({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],
    }),
}));
```

### 3. Store with Persist
File: `src/modules/[module]/store/user-preferences-store.js`

```jsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserPreferencesStore = create(
  persist(
    (set) => ({
      language: 'en',
      fontSize: 'medium',
      darkMode: false,

      setLanguage: (lang) => set({ language: lang }),
      setFontSize: (size) => set({ fontSize: size }),
      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),

      reset: () =>
        set({
          language: 'en',
          fontSize: 'medium',
          darkMode: false,
        }),
    }),
    {
      name: 'user-preferences',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  )
);
```

### 4. Store with Async Actions
File: `src/modules/[module]/store/data-store.js`

```jsx
import { create } from 'zustand';
import { apiClient } from '@/modules/core/api';

export const useDataStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,

  // Async action
  fetchData: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/api/data/${id}`);
      set({
        data: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  setData: (data) => set({ data }),

  clearData: () => set({ data: null, error: null }),

  reset: () =>
    set({ data: null, isLoading: false, error: null }),
}));
```

### 5. Usage in Client Component
```jsx
'use client';

import { useUIStore } from '@/modules/core/store';

export function Sidebar() {
  const isOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <button onClick={toggleSidebar}>
      {isOpen ? 'Close' : 'Open'} Sidebar
    </button>
  );
}
```

### 6. Validation Checklist
- [ ] Store placed in `src/modules/[module]/store/`
- [ ] Named as `use*Store` convention
- [ ] Uses `create()` from zustand
- [ ] State properties are immutable
- [ ] Actions are properly typed
- [ ] Selectors defined for frequently used values
- [ ] Reset function available
- [ ] Persist middleware (if needed)
- [ ] Devtools enabled (development)
- [ ] File under 100 lines

## Common Patterns

**Simple Toggle:**
```jsx
toggleValue: () =>
  set((state) => ({ value: !state.value }))
```

**Array Operations:**
```jsx
addItem: (item) =>
  set((state) => ({
    items: [...state.items, item],
  })),
removeItem: (id) =>
  set((state) => ({
    items: state.items.filter((i) => i.id !== id),
  })),
```

**Nested Object Update:**
```jsx
updateUser: (updates) =>
  set((state) => ({
    user: { ...state.user, ...updates },
  }))
```

## Store Usage Rules
- Use selectors to prevent unnecessary re-renders
- Keep store shallow and flat
- Use Zustand for UI/client state only
- Use TanStack Query for server state
- Don't store derived data (compute in selectors)
- Reset state properly

## Do NOT
- ❌ Store server data (use TanStack Query)
- ❌ Use complex nested state (keep flat)
- ❌ Mutate state directly (use set)
- ❌ Store functions (use selectors instead)
- ❌ Forget reset function
- ❌ Use relative imports
