'use client';

import { useSearchParams } from 'next/navigation';

import { useRouter } from '@/i18n/navigation';
import {
  readClassDetailParams,
  switchClassHref,
  withClassDetailParam,
} from '@/modules/teacher/lib/results-shell';
import type {
  ClassDetailParamsState,
  ClassDetailPatch,
} from '@/modules/teacher/types/results-shell.types';

/**
 * The class detail's tab, skill and sitting, held in the URL. A tab or skill
 * change rewrites the query in place with the History API, which the Next router
 * observes (useSearchParams updates) without refetching the page; switching to
 * another class is a real navigation.
 */
export function useClassDetailParams(): ClassDetailParamsState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readClassDetailParams(searchParams);

  const replaceQuery = (patch: ClassDetailPatch) => {
    const query = withClassDetailParam(searchParams, patch);
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  return {
    ...params,
    setTab: (tab) => replaceQuery({ tab }),
    setSkill: (skill) => replaceQuery({ skill }),
    switchClass: (classDocumentId) => router.push(switchClassHref(classDocumentId, params)),
  };
}
