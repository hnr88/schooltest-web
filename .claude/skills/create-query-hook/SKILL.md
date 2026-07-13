---
name: create-query-hook
description: Create a TanStack Query useQuery hook with Axios
---

# Create Query Hook

Creates a custom React hook using TanStack Query (React Query v5) and Axios for fetching data with proper error handling and caching.

## Usage
```
/create-query-hook [hook-name] [--with-params] [--with-enabled]
```

Example: `/create-query-hook useStudents --with-params`

## Instructions

### 1. Basic Query Hook
File: `src/modules/[module]/hooks/useStudents.js`

```jsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: () =>
      apiClient
        .get('/api/students')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### 2. Query Hook with Parameters (if `--with-params`)
```jsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useStudent(id) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () =>
      apiClient
        .get(`/api/students/${id}`)
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
    // Disable query if no id provided
    enabled: !!id,
  });
}
```

### 3. Query Hook with Multiple Filters (if `--with-params`)
```jsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useStudentsByClass(classId, filters = {}) {
  return useQuery({
    queryKey: ['students', classId, filters],
    queryFn: () =>
      apiClient
        .get('/api/students', {
          params: {
            'filters[class][$eq]': classId,
            ...filters,
          },
        })
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!classId,
  });
}
```

### 4. Query Hook with Enabled Condition (if `--with-enabled`)
```jsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () =>
      apiClient
        .get(`/api/users/${userId}`)
        .then((response) => response.data),
    staleTime: 1000 * 60 * 10,
    // Only fetch if userId exists
    enabled: !!userId,
    // Automatically refetch if userId changes
    refetchOnMount: 'stale',
  });
}
```

### 5. Usage in Components
```jsx
'use client';

import { useStudents } from '@/modules/students/hooks';
import { useTranslations } from 'next-intl';

export function StudentList() {
  const t = useTranslations('Students');
  const { data, isLoading, isError, error } = useStudents();

  if (isLoading) {
    return <div className="py-8 text-center">{t('loading')}</div>;
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-red-600">
        {t('error')}: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data?.students?.map((student) => (
        <div key={student.id} className="p-4 border rounded">
          {student.name}
        </div>
      ))}
    </div>
  );
}
```

### 6. Validation Checklist
- [ ] Hook placed in `src/modules/[module]/hooks/`
- [ ] Named with `use*` convention
- [ ] Uses `useQuery` from `@tanstack/react-query`
- [ ] Uses `apiClient` from `@/modules/core/api`
- [ ] Has proper `queryKey` (includes variables)
- [ ] Returns response.data (not full response)
- [ ] Has `staleTime` configured
- [ ] `enabled` condition when needed
- [ ] Error handling included
- [ ] File under 60 lines
- [ ] Uses `@/` imports only

## Query Key Patterns
```jsx
// Simple
queryKey: ['students']

// With ID
queryKey: ['student', id]

// With Multiple Filters
queryKey: ['students', classId, { sort: 'name', status: 'active' }]

// Nested
queryKey: ['user', userId, 'posts', postId]
```

## Common Options
```jsx
useQuery({
  queryKey: [...],
  queryFn: [...],
  staleTime: 1000 * 60 * 5,      // 5 minutes
  gcTime: 1000 * 60 * 10,        // 10 minutes (cache time)
  retry: 1,                       // Retry failed requests 1 time
  enabled: true,                  // Enable/disable query
  refetchOnMount: 'stale',        // Refetch on mount if stale
  refetchOnWindowFocus: true,     // Refetch on window focus
  refetchOnReconnect: true,       // Refetch on reconnect
  select: (data) => data,         // Transform data
  placeholderData: [],            // Show while loading
  throwOnError: false,            // Don't throw errors
});
```

## Do NOT
- ❌ Use `fetch()` - use Axios with apiClient
- ❌ Call queries inside loops
- ❌ Use SWR instead of TanStack Query
- ❌ Forget `enabled` condition for dependent queries
- ❌ Make queryKey too specific (causes cache misses)
- ❌ Use relative imports
