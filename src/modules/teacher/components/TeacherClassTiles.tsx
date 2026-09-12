'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ClassBadge } from '@/modules/teacher/components/v2/ClassBadge';
import { DeltaText } from '@/modules/teacher/components/v2/DeltaText';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { SOON_TILE_SKILLS } from '@/modules/teacher/constants/classes-screen.constants';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import { useYearLabel } from '@/modules/teacher/hooks/useClassesDirectory';
import type { ClassRowView, TeacherClassTilesProps } from '@/modules/teacher/types/classes-screen.types';

const TILE_EYEBROW = 'text-[10.5px] font-semibold tracking-[0.06em] text-[#6B7280] uppercase';

/** One class tile (`Teacher Portal v2.dc.html:121–161`): the whole card opens the class. */
function TeacherClassTile({ row }: { row: ClassRowView }) {
  const t = useTranslations('TeacherPortal.classes');
  const tKit = useTranslations('TeacherPortal.kit');
  const meta = useYearLabel()(row.year);

  return (
    <Link
      href={row.href}
      data-slot="results-class-row"
      data-class-id={row.id}
      data-live={row.isLive || undefined}
      className={cn(
        'flex flex-col gap-[15px] rounded-[12px] border bg-white p-[18px] transition-[border-color,box-shadow] hover:border-[#C9D2E4] hover:shadow-[0_4px_14px_rgba(14,35,80,0.07)] motion-reduce:transition-none',
        row.isLive ? 'border-[#EE9C93] shadow-[0_0_0_3px_rgba(217,45,32,0.10)]' : 'border-[#ECEEF2]',
        KIT_FOCUS_RING,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <ClassBadge code={row.badge} size="md" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-navy-900">{row.name}</span>
            {meta === null ? null : <span className="mt-0.5 block text-[12.5px] text-[#6B7280]">{meta}</span>}
          </span>
        </span>
        <span data-slot={row.isLive ? 'results-live-badge' : 'results-status'} className="flex-none">
          <TeacherStatusPill status={row.isLive ? 'live' : row.statusKey} size="md" />
        </span>
      </span>
      <span className="grid grid-cols-4 gap-2 border-t border-[#F3F4F6] pt-3.5">
        <span className="min-w-0 rounded-[9px] border border-[#E4EBF6] bg-[#F4F7FC] px-2.5 py-[9px]">
          <span className="block text-[10px] font-semibold tracking-[0.04em] text-[#5B7099] uppercase">
            {t('tile.reading')}
          </span>
          <span className="mt-[3px] block text-[16px] font-semibold text-navy-900 tabular-nums">
            {row.readingAverage === null ? tKit('noValue') : `${Math.round(row.readingAverage)}%`}
          </span>
        </span>
        {SOON_TILE_SKILLS.map((skill) => (
          <span key={skill} className="min-w-0 rounded-[9px] border border-[#EEF1F5] bg-[#FAFBFC] px-2.5 py-[9px]">
            <span className="block text-[10px] font-semibold tracking-[0.04em] text-[#6B7280] uppercase">
              {t(`tile.${skill}`)}
            </span>
            <span className="mt-[5px] block text-[11.5px] font-semibold tracking-[0.03em] text-[#6B7280] uppercase">
              {t('tile.soon')}
            </span>
          </span>
        ))}
      </span>
      <span className="flex gap-[22px] border-t border-[#F3F4F6] pt-3">
        <span className="min-w-0">
          <span className={cn('block', TILE_EYEBROW)}>{t('tile.students')}</span>
          <span className="mt-1 block text-[15px] font-semibold text-navy-900 tabular-nums">{row.studentCount}</span>
        </span>
        <span className="min-w-0">
          <span className={cn('block', TILE_EYEBROW)}>{t('tile.growth')}</span>
          <span className="mt-1 block text-[15px]">
            <DeltaText value={row.readingDelta} format="signed" size="lg" />
          </span>
        </span>
      </span>
    </Link>
  );
}

/** The tiles body (`:118–165`): auto-fill 288px columns under a hairline. */
function TeacherClassTiles({ rows, empty }: TeacherClassTilesProps) {
  return (
    <div
      data-layout="tiles"
      className="grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-3.5 border-t border-[#ECEEF2] px-8 pt-2 pb-[26px]"
    >
      {rows.length === 0 ? (
        <div className="col-span-full">{empty}</div>
      ) : (
        rows.map((row) => <TeacherClassTile key={row.id} row={row} />)
      )}
    </div>
  );
}

export { TeacherClassTiles };
