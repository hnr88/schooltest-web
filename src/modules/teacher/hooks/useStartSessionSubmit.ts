'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { LIVE_SESSIONS_HREF, LIVE_TAB_HREF } from '@/modules/teacher/constants/start-session.constants';
import { describeStartSessionFailure } from '@/modules/teacher/lib/start-session-errors';
import { useCreateTestSessionMutation } from '@/modules/teacher/queries/use-create-test-session.mutation';
import { useUpdateTestSessionMutation } from '@/modules/teacher/queries/use-update-test-session.mutation';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';
import type { StartSessionFailure } from '@/modules/teacher/types/start-session-modal.types';
import type {
  CreateTestSessionBody,
  UpdateTestSessionBody,
} from '@/modules/teacher/types/teacher-session.types';

/**
 * The three real writes behind the CTA. Start now lands on the class's Live tab
 * with the new sitting selected; a booking (new or edited) lands on Live
 * sessions. A refusal stays in the modal as the server said it, and the reads
 * behind the busy check are refreshed so the roster catches up with the server.
 */
export function useStartSessionSubmit(timeZone: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const close = useStartSessionStore((state) => state.close);
  const create = useCreateTestSessionMutation();
  const update = useUpdateTestSessionMutation();
  const [failure, setFailure] = useState<StartSessionFailure | null>(null);

  const onError = (error: unknown) => {
    setFailure(describeStartSessionFailure(error, timeZone));
    void queryClient.invalidateQueries({ queryKey: ['teacher', 'test-sessions'] });
    void queryClient.invalidateQueries({ queryKey: ['teacher', 'test-session-monitor'] });
  };
  const finish = (href: string) => {
    close();
    router.push(href);
  };

  return {
    failure,
    isPending: create.isPending || update.isPending,
    startNow: (body: CreateTestSessionBody) => {
      setFailure(null);
      create.mutate(body, {
        onSuccess: (sitting) => finish(LIVE_TAB_HREF(sitting.class.document_id, sitting.sitting_document_id)),
        onError,
      });
    },
    book: (body: CreateTestSessionBody) => {
      setFailure(null);
      create.mutate(body, { onSuccess: () => finish(LIVE_SESSIONS_HREF), onError });
    },
    saveBooking: (documentId: string, body: UpdateTestSessionBody) => {
      setFailure(null);
      update.mutate({ documentId, body }, { onSuccess: () => finish(LIVE_SESSIONS_HREF), onError });
    },
  };
}
