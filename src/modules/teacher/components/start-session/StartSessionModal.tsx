'use client';

import { OpsDialog, OpsDialogContent } from '@/modules/design-system';
import { StartSessionContent } from '@/modules/teacher/components/start-session/StartSessionContent';
import { START_SESSION_PANEL_CLASS } from '@/modules/teacher/constants/start-session-styles.constants';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

/**
 * The ONE "Start a new session" modal. Every teacher screen opens it through
 * `useStartSessionStore().open(...)`; nothing is read while it is closed.
 */
function StartSessionModal() {
  const isOpen = useStartSessionStore((state) => state.isOpen);
  const close = useStartSessionStore((state) => state.close);
  return (
    <OpsDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <OpsDialogContent data-surface="start-session-modal" className={START_SESSION_PANEL_CLASS}>
        {isOpen ? <StartSessionContent /> : null}
      </OpsDialogContent>
    </OpsDialog>
  );
}

export { StartSessionModal };
