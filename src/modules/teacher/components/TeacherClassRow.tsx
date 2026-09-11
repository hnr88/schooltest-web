'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ClassBadge } from '@/modules/teacher/components/v2/ClassBadge';
import { DeltaText } from '@/modules/teacher/components/v2/DeltaText';
import { ExportButtons } from '@/modules/teacher/components/v2/ExportButtons';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { CLASSES_TD, SOON_COLUMNS } from '@/modules/teacher/constants/classes-screen.constants';
import { useYearLabel } from '@/modules/teacher/hooks/useClassesDirectory';
import type { TeacherClassRowProps } from '@/modules/teacher/types/classes-screen.types';

/**
 * One class of the list (`Teacher Portal v2.dc.html:180–207`). The class name
 * is the row's link, stretched over the row so a click anywhere opens the
 * class; the export pair sits above it. A class with an open sitting shows the
 * LIVE NOW badge and no status line — never both. `results-class-row`,
 * `data-class-id`, `results-live-badge` and `results-status` stay for the specs.
 */
function TeacherClassRow({ row, exports }: TeacherClassRowProps) {
  const t = useTranslations('TeacherPortal.classes');
  const tKit = useTranslations('TeacherPortal.kit');
  const meta = useYearLabel()(row.year);
  const pending = exports.pending?.id === row.id ? exports.pending.kind : null;

  return (
    <tr
      data-slot="results-class-row"
      data-class-id={row.id}
      data-live={row.isLive || undefined}
      className="relative transition-colors hover:bg-[#FAFBFC] motion-reduce:transition-none"
    >
      <td className={cn(CLASSES_TD, 'pl-8')}>
        <div className="flex min-w-[150px] items-center gap-3">
          <ClassBadge code={row.badge} />
          <div className="min-w-0">
            <Link
              href={row.href}
              className="block truncate text-[14.5px] font-medium text-navy-900 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-navy-900/30 focus-visible:after:ring-inset"
            >
              {row.name}
            </Link>
            {meta === null ? null : <div className="mt-0.5 text-[12.5px] text-[#6B7280]">{meta}</div>}
          </div>
        </div>
      </td>
      <td className={CLASSES_TD}>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-semibold text-navy-900 tabular-nums">
            {row.readingAverage === null ? tKit('noValue') : `${Math.round(row.readingAverage)}%`}
          </span>
          {row.readingAverage === null ? null : <DeltaText value={row.readingDelta} />}
        </span>
      </td>
      {SOON_COLUMNS.map((column) => (
        <td key={column} className={CLASSES_TD}>
          <span aria-hidden="true" className="text-[14px] font-medium text-[#C9CFD8]">
            {tKit('noValue')}
          </span>
          <span className="sr-only">{t('soonLabel')}</span>
        </td>
      ))}
      <td className={CLASSES_TD}>
        {row.isLive ? (
          <span data-slot="results-live-badge">
            <TeacherStatusPill status="live" size="sm" />
          </span>
        ) : (
          <span data-slot="results-status">
            <TeacherStatusPill status={row.statusKey} appearance="dot" />
          </span>
        )}
      </td>
      <td className={cn(CLASSES_TD, 'pr-8')}>
        {row.hasExport ? (
          <ExportButtons
            onPdf={() => exports.downloadPdf(row)}
            onLlm={() => exports.downloadLlm(row)}
            pdfTitle={t('pdfTitle')}
            llmTitle={t('llmTitle')}
            pdfPending={pending === 'pdf'}
            llmPending={pending === 'llm'}
          />
        ) : null}
      </td>
    </tr>
  );
}

export { TeacherClassRow };
