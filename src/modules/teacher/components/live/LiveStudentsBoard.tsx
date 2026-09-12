'use client';

import { useTranslations } from 'next-intl';

import { LiveBatchBar } from '@/modules/teacher/components/live/LiveBatchBar';
import { LiveSelectBox } from '@/modules/teacher/components/live/LiveSelectBox';
import { LiveStudentCard } from '@/modules/teacher/components/live/LiveStudentCard';
import type {
  LiveBatchKind,
  LiveRowActionKey,
  LiveSelection,
  LiveStudentRow,
} from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1158–1205 — the card grid on #FAFBFC with its
// sticky "Select students" header, the batch bar once anything is ticked, the
// empty-filter line and the not-signed-in footnote.
function LiveStudentsBoard({
  rows,
  notSignedIn,
  total,
  selected,
  selection,
  selectedCount,
  tallies,
  interactive,
  retried,
  onToggle,
  onToggleAll,
  onClear,
  onRowAction,
  onBatch,
}: {
  rows: readonly LiveStudentRow[];
  notSignedIn: number;
  total: number;
  selected: ReadonlySet<string>;
  selection: LiveSelection;
  selectedCount: number;
  tallies: readonly { kind: LiveBatchKind; hit: number }[];
  interactive: boolean;
  retried: ReadonlySet<string>;
  onToggle: (studentId: string) => void;
  onToggleAll: () => void;
  onClear: () => void;
  onRowAction: (key: LiveRowActionKey, row: LiveStudentRow) => void;
  onBatch: (kind: LiveBatchKind) => void;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  return (
    <div
      data-slot="live-students-board"
      className="rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[30px]"
    >
      <div className="sticky top-0 z-[2] flex items-center gap-3.5 border-b border-[#ECEEF2] bg-white pt-4 pb-3">
        <LiveSelectBox state={selection} label={t('selectAll')} onToggle={onToggleAll} />
        <span
          data-slot="live-students-selection"
          className="flex-1 text-[11.5px] font-semibold tracking-[0.06em] text-[#6B7280] uppercase"
        >
          {selectedCount > 0 ? t('selected', { count: selectedCount }) : t('selectStudents')}
        </span>
        {interactive && selectedCount > 0 ? (
          <LiveBatchBar tallies={tallies} selectedCount={selectedCount} onRun={onBatch} onClear={onClear} />
        ) : null}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 py-4">
        {rows.map((row) => (
          <LiveStudentCard
            key={row.studentId}
            row={row}
            selected={selected.has(row.studentId)}
            interactive={interactive}
            retried={retried}
            onToggle={onToggle}
            onAction={onRowAction}
          />
        ))}
      </div>
      {rows.length === 0 ? (
        <p data-slot="live-students-empty" className="px-2.5 py-11 text-center text-[14px] text-[#6B7280]">
          {t('empty')}
        </p>
      ) : null}
      <p data-slot="live-students-footnote" className="pt-3.5 pb-[18px] text-[13px] text-[#6B7280]">
        {t('footnote', { count: notSignedIn, total })}
      </p>
    </div>
  );
}

export { LiveStudentsBoard };
