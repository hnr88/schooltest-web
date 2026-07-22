'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';
import { useRecordCrumbStore } from '@/modules/shell/stores/use-record-crumb-store';

// Publishes the final ("record") crumb of the topbar trail from a page-level
// component — e.g. the child's name on /dashboard/children/<id>, which the
// section-level route meta cannot know. Pass a falsy label while the record is
// still loading; the trail simply ends at the section until the name arrives.
// The crumb is cleared on unmount and is scoped to the route it was published for.
export function useRecordCrumb(label: string | null | undefined): void {
  const pathname = usePathname();
  const setRecordCrumb = useRecordCrumbStore((state) => state.setRecordCrumb);
  const clearRecordCrumb = useRecordCrumbStore((state) => state.clearRecordCrumb);

  useEffect(() => {
    if (!label) return undefined;
    setRecordCrumb(pathname, label);
    return () => clearRecordCrumb(pathname);
  }, [label, pathname, setRecordCrumb, clearRecordCrumb]);
}

// Topbar-side reader: yields the crumb only when it belongs to the current route.
export function useRecordCrumbLabel(pathname: string): string | null {
  return useRecordCrumbStore((state) => (state.pathname === pathname ? state.label : null));
}
