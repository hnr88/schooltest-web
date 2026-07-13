---
name: create-loading-state
description: Create loading states, skeletons, and suspense boundaries for better UX
---

# Create Loading States

Creates consistent loading states using Suspense, skeleton components, and loading indicators following shadcn/ui patterns.

## Usage
```
/create-loading-state [component-type] [--skeleton] [--spinner]
```

## Instructions

### 1. Route Loading State (loading.tsx)
File: `src/app/[locale]/users/loading.jsx`

```jsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container py-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          {/* Table header */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}
```

### 2. Card Skeleton Component
File: `src/modules/[module]/components/CardSkeleton.jsx`

```jsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-4/5" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### 3. Profile/Avatar Skeleton
File: `src/modules/[module]/components/ProfileSkeleton.jsx`

```jsx
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
```

### 4. Spinner/Loading Indicator
File: `src/components/ui/spinner.jsx`

```jsx
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Spinner({ className, size = 'default' }) {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', sizes[size], className)}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export function InlineSpinner({ children }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size="sm" />
      {children}
    </span>
  );
}
```

### 5. Button Loading State
```jsx
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function SubmitButton({ isLoading, children, ...props }) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

### 6. Suspense with Skeleton
File: `src/app/[locale]/dashboard/page.jsx`

```jsx
import { Suspense } from 'react';
import { CardGridSkeleton } from '@/modules/dashboard/components/CardSkeleton';
import { DashboardCards } from '@/modules/dashboard/components/DashboardCards';

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <Suspense fallback={<CardGridSkeleton count={4} />}>
        <DashboardCards />
      </Suspense>
    </div>
  );
}
```

### 7. Conditional Loading in Client Components
```jsx
'use client';

import { useStudents } from '@/modules/students/hooks';
import { CardGridSkeleton } from '@/modules/students/components/CardSkeleton';
import { StudentCard } from '@/modules/students/components/StudentCard';

export function StudentList() {
  const { data, isLoading, isError } = useStudents();

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  if (isError) {
    return <div className="text-center text-destructive">Error loading students</div>;
  }

  if (!data?.length) {
    return <div className="text-center text-muted-foreground">No students found</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

### 8. Skeleton Animation Variants
```jsx
// Pulse animation (default)
<Skeleton className="h-4 w-full" />

// Shimmer animation (custom)
<Skeleton className="h-4 w-full animate-shimmer" />

// In globals.css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 9. Validation Checklist
- [ ] Route has `loading.jsx` file
- [ ] Skeletons match actual content layout
- [ ] Skeleton dimensions approximate real content
- [ ] Uses shadcn `Skeleton` component
- [ ] Suspense boundaries wrap async components
- [ ] Button loading states with spinner
- [ ] Query loading states handled
- [ ] Empty states handled after loading
- [ ] Error states handled

## Do NOT
- ❌ Use generic spinners for all loading states
- ❌ Skip skeleton dimensions (causes layout shift)
- ❌ Forget Suspense boundaries in Server Components
- ❌ Block entire page while loading
- ❌ Use loading state without timeout fallback
