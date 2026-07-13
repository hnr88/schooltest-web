---
name: create-mutation-hook
description: Create a TanStack Query useMutation hook with Axios for POST/PUT/DELETE
---

# Create Mutation Hook

Creates a custom React hook using TanStack Query useMutation and Axios for data mutations (create, update, delete) with proper error handling and cache invalidation.

## Usage
```
/create-mutation-hook [hook-name] [--with-optimistic] [--invalidate-keys]
```

Example: `/create-mutation-hook useCreateStudent --invalidate-keys`

## Instructions

### 1. Basic Mutation Hook (CREATE)
File: `src/modules/[module]/hooks/useCreateStudent.ts`

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

interface CreateStudentInput {
  name: string;
  email: string;
  classId: string;
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentInput) =>
      apiClient
        .post('/api/students', { data })
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

### 2. Update Mutation Hook (PUT/PATCH)
File: `src/modules/[module]/hooks/useUpdateStudent.ts`

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

interface UpdateStudentInput {
  id: string;
  data: {
    name?: string;
    email?: string;
  };
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateStudentInput) =>
      apiClient
        .put(`/api/students/${id}`, { data })
        .then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
    },
  });
}
```

### 3. Delete Mutation Hook
File: `src/modules/[module]/hooks/useDeleteStudent.ts`

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

### 4. Optimistic Updates (if `--with-optimistic`)
```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/api/items/${id}/favorite`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previousItems = queryClient.getQueryData(['items']);

      queryClient.setQueryData(['items'], (old: any) =>
        old?.map((item: any) =>
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      );

      return { previousItems };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['items'], context?.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

### 5. Usage in Components
```tsx
'use client';

import { useCreateStudent } from '@/modules/students/hooks';
import { useToast } from '@/components/ui/use-toast';
import { StudentForm } from './StudentForm';

export function CreateStudentForm() {
  const { toast } = useToast();
  const mutation = useCreateStudent();

  const handleSubmit = (data: CreateStudentInput) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Student created successfully' });
      },
      onError: (error) => {
        toast({
          title: 'Failed to create student',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <StudentForm
      onSubmit={handleSubmit}
      isLoading={mutation.isPending}
    />
  );
}
```

### 6. Validation Checklist
- [ ] Hook placed in `src/modules/[module]/hooks/`
- [ ] Named with `use*` convention (useCreate*, useUpdate*, useDelete*)
- [ ] Uses `useMutation` from `@tanstack/react-query`
- [ ] Uses `apiClient` from `@/modules/core/api`
- [ ] Has `'use client'` directive
- [ ] Returns response.data from mutationFn
- [ ] Invalidates relevant query keys on success
- [ ] TypeScript interfaces for input data
- [ ] File under 60 lines
- [ ] Uses `@/` imports only

## Mutation Patterns

**Create:**
```tsx
mutationFn: (data) => apiClient.post('/api/resource', { data })
```

**Update:**
```tsx
mutationFn: ({ id, data }) => apiClient.put(`/api/resource/${id}`, { data })
```

**Partial Update:**
```tsx
mutationFn: ({ id, data }) => apiClient.patch(`/api/resource/${id}`, { data })
```

**Delete:**
```tsx
mutationFn: (id) => apiClient.delete(`/api/resource/${id}`)
```

## Cache Invalidation Patterns

```tsx
// Invalidate list
queryClient.invalidateQueries({ queryKey: ['students'] });

// Invalidate specific item
queryClient.invalidateQueries({ queryKey: ['student', id] });

// Invalidate multiple
queryClient.invalidateQueries({ queryKey: ['students'] });
queryClient.invalidateQueries({ queryKey: ['classes'] });

// Invalidate all queries starting with prefix
queryClient.invalidateQueries({ queryKey: ['students'], exact: false });
```

## Do NOT
- ❌ Use fetch() - use Axios with apiClient
- ❌ Forget to invalidate cache on success
- ❌ Use useQuery for mutations
- ❌ Forget 'use client' directive
- ❌ Skip error handling
- ❌ Use relative imports
