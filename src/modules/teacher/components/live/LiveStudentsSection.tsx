'use client';

import { useTranslations } from 'next-intl';

import { ReviewDrawer } from '@/modules/report';
import { LiveResitQueue } from '@/modules/teacher/components/live/LiveResitQueue';
import { LiveStudentsBoard } from '@/modules/teacher/components/live/LiveStudentsBoard';
import { LiveStudentsDialog } from '@/modules/teacher/components/live/LiveStudentsDialog';
import { LiveStudentsToolbar } from '@/modules/teacher/components/live/LiveStudentsToolbar';
import { useLiveStudentActions } from '@/modules/teacher/hooks/useLiveStudentActions';
import { useLiveStudents } from '@/modules/teacher/hooks/useLiveStudents';
import { useLiveStudentsView } from '@/modules/teacher/hooks/useLiveStudentsView';
import { batchTallies } from '@/modules/teacher/lib/live-student-actions';
import { notSignedInCount, resitQueue } from '@/modules/teacher/lib/live-students';
import type { LiveStudentsSectionProps } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1147–1242 — the Live tab's student half: the filter
// bar, the card grid with its row menu and batch bar, and "Waiting on a re-sit".
// Every action is a real write against this sitting; nothing is simulated.
function LiveStudentsSection({ sittingId, classDocumentId, afterBoard }: LiveStudentsSectionProps) {
  const t = useTranslations('TeacherPortal.live.students');
  const live = useLiveStudents(sittingId, classDocumentId);
  const view = useLiveStudentsView(live.rows);
  const actions = useLiveStudentActions({
    sittingId,
    classDocumentId,
    rows: live.rows,
    selected: view.selected,
    rememberResult: live.rememberResult,
    clearSelection: view.clear,
  });

  return (
    <div
      data-slot="live-students"
      data-sitting-id={sittingId}
      data-class-id={classDocumentId}
      data-status={live.isPending ? 'loading' : live.isError ? 'error' : 'ready'}
      className="flex flex-col gap-[18px]"
    >
      {live.isPending ? <p className="text-[13.5px] text-[#6B7280]">{t('loading')}</p> : null}
      {live.isError ? (
        <p role="alert" className="text-[13.5px] text-[#B42318]">
          {t('loadError')}
        </p>
      ) : null}
      {live.isPending || live.isError ? null : (
        <>
          <LiveStudentsToolbar
            query={view.query}
            onQuery={view.setQuery}
            filter={view.filter}
            onFilter={view.setFilter}
            shown={view.visible.length}
            total={live.rows.length}
          />
          <LiveStudentsBoard
            rows={view.visible}
            notSignedIn={notSignedInCount(live.rows)}
            total={live.rows.length}
            selected={view.selected}
            selection={view.selection}
            selectedCount={view.selectedCount}
            tallies={batchTallies(live.rows, view.selected)}
            interactive={live.isOpen}
            retried={actions.retried}
            onToggle={view.toggle}
            onToggleAll={view.toggleAll}
            onClear={view.clear}
            onRowAction={actions.chooseRow}
            onBatch={actions.chooseBatch}
          />
          {afterBoard}
          <LiveResitQueue entries={resitQueue(live.rows)} classDocumentId={classDocumentId} />
          <LiveStudentsDialog
            dialog={actions.dialog}
            pending={actions.pending}
            error={actions.error}
            onConfirm={actions.confirm}
            onClose={actions.close}
          />
          {actions.review === null || actions.review.resultId === null ? null : (
            <ReviewDrawer
              resultDocumentId={actions.review.resultId}
              open
              onOpenChange={(next) => {
                if (!next) actions.closeReview();
              }}
              studentName={actions.review.name}
              className={live.className}
            />
          )}
        </>
      )}
    </div>
  );
}

export { LiveStudentsSection };
