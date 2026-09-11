'use client';

import { TEACHER_ROLE_TYPE, useAuth } from '@/modules/auth';
import { StartSessionModal } from '@/modules/teacher/components/start-session/StartSessionModal';

/**
 * Mounted once in the dashboard frame. Only a teacher gets the modal; every
 * other role renders nothing, so their frame is unchanged. The identity is the
 * shared `['auth','me']` read the rail already made — no extra request.
 */
function StartSessionHost() {
  const { user } = useAuth();
  return user?.role?.type === TEACHER_ROLE_TYPE ? <StartSessionModal /> : null;
}

export { StartSessionHost };
