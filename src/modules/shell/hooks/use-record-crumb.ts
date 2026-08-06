'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';
import { useRecordCrumbStore } from '@/modules/shell/stores/use-record-crumb-store';

// Publishes the final ("record") crumb of the topbar trail from a page-level
// component — e.g. the child's name on /dashboard/children/<id>, which the
// section-level route meta cannot know. Pass a falsy label while the record is
// still loading; the trail simply ends at the section until the name arrives.
// The crumb is cleared on unmount and is scoped to the route it was published for.
export function useRecordCrumb(
  label: string | null | undefined,
  // A route with a record INSIDE a record (a student inside a class) also
  // publishes the ancestor's name, keyed by its href, so the class crumb reads
  // as the class rather than repeating the student.
  ancestors?: Readonly<Record<string, string>>,
): void {
  const pathname = usePathname();
  const setRecordCrumb = useRecordCrumbStore((state) => state.setRecordCrumb);
  const clearRecordCrumb = useRecordCrumbStore((state) => state.clearRecordCrumb);
  const ancestorKey = ancestors ? JSON.stringify(ancestors) : '';

  useEffect(() => {
    if (!label) return undefined;
    setRecordCrumb(pathname, label, ancestorKey ? (JSON.parse(ancestorKey) as Record<string, string>) : undefined);
    return () => clearRecordCrumb(pathname);
  }, [label, ancestorKey, pathname, setRecordCrumb, clearRecordCrumb]);
}

// Topbar-side reader: yields the crumb only when it belongs to the current route.
export function useRecordCrumbLabel(pathname: string): string | null {
  return useRecordCrumbStore((state) => (state.pathname === pathname ? state.label : null));
}

/** Ancestor record names for the current route, or an empty map. */
export function useRecordCrumbAncestors(pathname: string): Readonly<Record<string, string>> {
  return useRecordCrumbStore((state) => (state.pathname === pathname ? state.ancestors : EMPTY));
}

const EMPTY: Readonly<Record<string, string>> = {};
