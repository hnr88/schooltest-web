'use client';

import { TEACHER_ROLE_TYPE, useAuth } from '@/modules/auth';
import { DemoLinkDialog } from '@/modules/teacher/components/start-session/DemoLinkDialog';
import { StartSessionModal } from '@/modules/teacher/components/start-session/StartSessionModal';

/**
 * Mounted once in the dashboard frame. Only a teacher gets the modal; every
 * other role renders nothing, so their frame is unchanged. The identity is the
 * shared `['auth','me']` read the rail already made — no extra request.
 *
 * The demo-link dialog (TB-17) lives here rather than inside the modal: a minted
 * link closes the modal, and the dialog outlives it.
 */
function StartSessionHost() {
  const { user } = useAuth();
  if (user?.role?.type !== TEACHER_ROLE_TYPE) return null;
  return (
    <>
      <StartSessionModal />
      <DemoLinkDialog />
    </>
  );
}

export { StartSessionHost };
