'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AnnouncementBody, AnnouncementResponse } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { saveAnnouncement } from '@/modules/ops/actions/save-announcement.action';
import { PLATFORM_SETTINGS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPSF-04 — the announcement banner.
//
// This is the one editor that does NOT call Strapi from the browser. The save
// goes through the `saveAnnouncement` server action, because the announcement
// feeds a CACHED public page and the cache tag can only be invalidated
// server-side (see the action for the full reasoning). The operator's token is
// handed to the action, which forwards it so Strapi's own ops-only policy is
// still the thing that authorises the write.
export function useAnnouncementMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async (body: AnnouncementBody): Promise<AnnouncementResponse['data']> => {
      // A missing token is a programming error here — the console sits behind
      // OpsGuard — but failing loudly beats sending `Bearer undefined` and
      // reading the 401 as a server problem.
      if (!token) throw new Error('the announcement save needs a signed-in ops session');
      return saveAnnouncement({ token, body });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] }),
      ]);
    },
  });
}
