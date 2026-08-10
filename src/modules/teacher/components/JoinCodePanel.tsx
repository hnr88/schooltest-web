'use client';

import { useTranslations } from 'next-intl';

import { Alert } from '@/modules/design-system';
import { JoinCodeDisplay } from '@/modules/teacher/components/JoinCodeDisplay';
import { useJoinCodePanel } from '@/modules/teacher/hooks/useJoinCodePanel';

// The join code the teacher reads out. It is NOT handed over from the create's
// 201 and it is NOT kept in client state: it is C-TD-1's `live_session`, read
// live, so pressing "Generate join code" and pressing F5 land on exactly the
// same server answer.
//
// The wrapper is always mounted and is the live region, so the code is
// announced when it appears rather than arriving silently. Nothing renders
// while the reads are in flight, when the teacher has no open sitting, or when
// a read fails (the setup panel above owns that error) — an empty panel is the
// honest answer, never a placeholder code.
function JoinCodePanel() {
  const t = useTranslations('Teacher.testSessions.joinCode');
  const { view, isPending, isCopied, copyCode } = useJoinCodePanel();

  return (
    <div
      data-slot="join-code-region"
      data-status={isPending ? 'pending' : view.status}
      aria-live="polite"
    >
      {view.status === 'ready' ? (
        <JoinCodeDisplay
          view={view}
          isCopied={isCopied}
          onCopy={() => {
            void copyCode(view.code);
          }}
        />
      ) : null}

      {view.status === 'unavailable' ? (
        <Alert variant="warning" title={t('unavailableTitle')}>
          {t('unavailableBody', { className: view.className })}
        </Alert>
      ) : null}
    </div>
  );
}

export { JoinCodePanel };
