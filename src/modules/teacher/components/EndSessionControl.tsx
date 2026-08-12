'use client';

import { CircleStop } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { EndSessionDialog } from '@/modules/teacher/components/EndSessionDialog';
import { useEndSession } from '@/modules/teacher/hooks/useEndSession';
import type { EndSessionControlProps } from '@/modules/teacher/types/end-session.types';

// .qa/DESIGN.md §Live monitoring — "End session" sits in the header row, next to
// the LIVE badge and the join code (wireframe 09 view 2).
//
// It renders ONLY while C-TS-3 reports `status: 'open'`. A closed sitting has
// nothing to end, and the header already says "Closed" in words — so the control
// disappears instead of offering an action whose only possible answer is C-TS-4's
// 400. The visible state therefore always comes from the server's payload, never
// from a local "I clicked it" flag.
function EndSessionControl({ sitting }: EndSessionControlProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const endSession = useEndSession(sitting.document_id);

  if (sitting.status !== 'open') return null;

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="h-11 px-4"
        data-slot="end-session-trigger"
        loading={endSession.isPending}
        onClick={endSession.openConfirm}
      >
        <CircleStop aria-hidden="true" className="size-4" />
        {t('endSession')}
      </Button>
      <EndSessionDialog
        sessionClassName={sitting.class.name}
        open={endSession.isConfirmOpen}
        isPending={endSession.isPending}
        onOpenChange={endSession.setConfirmOpen}
        onConfirm={endSession.confirm}
      />
    </>
  );
}

export { EndSessionControl };
