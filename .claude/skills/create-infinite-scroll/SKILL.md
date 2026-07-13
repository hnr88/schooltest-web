---
name: create-infinite-scroll
description: Create infinite scroll lists using TanStack Query with intersection observer
---

# Create Infinite Scroll

Creates infinite scrolling lists using TanStack Query's `useInfiniteQuery` with intersection observer for automatic loading.

## Usage
```
/create-infinite-scroll [list-name] [--with-virtualization]
```

## Instructions

### 1. Create Infinite Query Hook
File: `src/modules/[module]/hooks/useInfiniteItems.js`

```jsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';

export function useInfiniteItems(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['items', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get('/api/items', {
        params: {
          'pagination[page]': pageParam,
          'pagination[pageSize]': 20,
          ...filters,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pageCount } = lastPage.meta.pagination;
      return page < pageCount ? page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const { page } = firstPage.meta.pagination;
      return page > 1 ? page - 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

### 2. Create Infinite Scroll Component
File: `src/modules/[module]/components/InfiniteItemList.jsx`

```jsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useInfiniteItems } from '@/modules/items/hooks/useInfiniteItems';
import { ItemCard } from './ItemCard';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export function InfiniteItemList({ filters }) {
  const t = useTranslations('Items');
  const loadMoreRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteItems(filters);

  // Intersection Observer for auto-loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-destructive">
        {t('error')}: {error.message}
      </div>
    );
  }

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('empty')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.documentId} item={item} />
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage ? (
          <Spinner />
        ) : hasNextPage ? (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noMore')}</p>
        )}
      </div>
    </div>
  );
}
```

### 3. Virtualized Infinite Scroll (for large lists)
File: `src/modules/[module]/components/VirtualizedList.jsx`

```jsx
'use client';

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteItems } from '@/modules/items/hooks/useInfiniteItems';
import { ItemRow } from './ItemRow';
import { Spinner } from '@/components/ui/spinner';

export function VirtualizedList({ filters }) {
  const parentRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteItems(filters);

  const allItems = data?.pages.flatMap((page) => page.data) ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  // Fetch more when scrolling near the end
  const lastItem = items[items.length - 1];
  if (
    lastItem &&
    lastItem.index >= allItems.length - 1 &&
    hasNextPage &&
    !isFetchingNextPage
  ) {
    fetchNextPage();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto rounded-md border"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= allItems.length;
          const item = allItems[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="flex items-center justify-center h-full">
                  {hasNextPage ? <Spinner /> : 'No more items'}
                </div>
              ) : (
                <ItemRow item={item} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4. Pull to Refresh Pattern
```jsx
'use client';

import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useInfiniteItems } from '@/modules/items/hooks/useInfiniteItems';

export function PullToRefreshList() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, refetch, fetchNextPage, hasNextPage } = useInfiniteItems();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  return (
    <div>
      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 mb-4"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>

      {/* Items list */}
      {/* ... */}
    </div>
  );
}
```

### 5. Infinite Scroll with Search
```jsx
'use client';

import { useState, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InfiniteItemList } from './InfiniteItemList';

export function SearchableInfiniteList() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filters = deferredSearch
    ? { 'filters[title][$containsi]': deferredSearch }
    : {};

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <InfiniteItemList filters={filters} />
    </div>
  );
}
```

### 6. Validation Checklist
- [ ] Uses `useInfiniteQuery` from TanStack Query
- [ ] Implements `getNextPageParam` correctly
- [ ] Intersection Observer for auto-loading
- [ ] Manual "Load More" button as fallback
- [ ] Loading state for initial load
- [ ] Loading indicator for fetching next page
- [ ] Empty state handling
- [ ] Error state handling
- [ ] Flattens pages data correctly
- [ ] Uses virtualization for large lists (1000+ items)

## Performance Tips
- Use `staleTime` to prevent refetching
- Use `useDeferredValue` for search inputs
- Use virtualization for 1000+ items
- Set appropriate `rootMargin` on observer

## Do NOT
- ❌ Use offset pagination with infinite scroll
- ❌ Forget loading indicators
- ❌ Re-fetch all pages on filter change
- ❌ Skip error handling
- ❌ Use index as key (use unique ID)
