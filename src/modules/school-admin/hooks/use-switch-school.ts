'use client';

import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';

import { useActiveSchoolStore } from '@/modules/school-admin/stores/use-active-school-store';

// Multi-tenant school switcher — the pick action. Order is load-bearing:
// holder first (so every refetch that races the navigation already carries
// the new header), then the store mirror, then the school-admin cache
// invalidation, then the reset to the school home (the design's
// pick: reset view + clear filters, School Admin Portal.dc.html:1690).
export function useSwitchSchool(): (documentId: string) => void {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setActiveSchool = useActiveSchoolStore((s) => s.setActiveSchool);
  const activeSchoolDocumentId = useActiveSchoolStore((s) => s.activeSchoolDocumentId);

  const switchSchool = (documentId: string) => {
    if (documentId === activeSchoolDocumentId) return;
    setActiveSchool(documentId);
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'school-admin',
    });
    router.replace('/dashboard/school');
  };

  return switchSchool;
}

// Stale-persist guard: a membership revoked while the pick sat in localStorage
// makes every scoped /schools/me/** call 403 with details.code SCHOOL_SCOPE
// forever. The error surfaces through ANY school-admin query; clearing the
// pick here once per mount lets the retry resolve the legacy primary school.
export function useClearActiveSchoolOnScopeError(hasScopeError: boolean): void {
  const queryClient = useQueryClient();
  const clearActiveSchool = useActiveSchoolStore((s) => s.clearActiveSchool);

  useEffect(() => {
    if (!hasScopeError) return;
    if (!useActiveSchoolStore.getState().activeSchoolDocumentId) return;
    clearActiveSchool();
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'school-admin',
    });
  }, [hasScopeError, clearActiveSchool, queryClient]);
}
