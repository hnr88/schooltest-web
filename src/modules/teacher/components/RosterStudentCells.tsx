'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { DeltaText } from '@/modules/teacher/components/v2/DeltaText';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { PhaseChip } from '@/modules/teacher/components/v2/PhaseChip';
import { STUDENTS_COLUMN } from '@/modules/teacher/constants/students-table.constants';
import { GROWTH_STEADY_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { acaraPhaseKey } from '@/modules/teacher/lib/teacher-kit';
import type { RosterStudentCellsProps } from '@/modules/teacher/types/students-table.types';

// Three cells of one Students-tab row (Teacher Portal v2 `:693–705`). Every value
// is the view model's (`studentsTabRow`): nothing is re-derived here, and a
// missing value renders the kit's dash — never a 0 and never a guessed phase.

const NAME_CLASS = 'block text-[14.5px] font-semibold';
const LINK_CLASS =
  "text-[#1A3B8B] outline-none hover:underline after:absolute after:inset-0 after:rounded-[8px] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-navy-900/30 focus-visible:after:ring-inset";

/** Avatar, name and "{Phase} phase". A scored student's name is the row's link, stretched over the row. */
export function RosterStudentCell({ row, href }: RosterStudentCellsProps & { href: string | null }) {
  const tVm = useTranslations('TeacherPortal.viewModel');

  return (
    <span role="cell" data-slot="student-cell" className={cn(STUDENTS_COLUMN.student, 'flex items-center gap-3')}>
      <InitialsAvatar initials={row.initials} className="flex-none" />
      <span className="min-w-0">
        {href === null ? (
          <span data-slot="student-name" className={cn(NAME_CLASS, 'text-navy-900')}>
            {row.name}
          </span>
        ) : (
          <Link href={href} data-slot="student-name" className={cn(NAME_CLASS, LINK_CLASS)}>
            {row.name}
          </Link>
        )}
        {row.phase === null ? null : (
          <span className="mt-px block text-[12px] text-[#6B7280]">{tVm(row.phase.subLabelKey)}</span>
        )}
      </span>
    </span>
  );
}

/** The server's growth claim: its signed step with an arrow, ±0, "steady" within error, or the dash. */
export function RosterGrowthCell({ row }: RosterStudentCellsProps) {
  const tVm = useTranslations('TeacherPortal.viewModel');
  const { growth } = row;

  return (
    <span
      role="cell"
      data-slot="student-growth"
      data-growth={growth.kind}
      className={cn(STUDENTS_COLUMN.growth, 'whitespace-nowrap')}
    >
      {growth.kind === 'steady' ? (
        <span className="text-[14px] font-semibold text-[#5B6472]">{tVm(GROWTH_STEADY_KEY)}</span>
      ) : (
        <DeltaText
          value={growth.points}
          format={growth.kind === 'flat' ? 'signed' : 'arrowSigned'}
          unit="%"
          size="md"
        />
      )}
    </span>
  );
}

/** The ACARA chip; "Not sat" only for a student with no result — a result without a phase is the dash. */
export function RosterPhaseCell({ row }: RosterStudentCellsProps) {
  const tKit = useTranslations('TeacherPortal.kit');

  return (
    <span role="cell" data-slot="student-phase" className={STUDENTS_COLUMN.phase}>
      {row.phase === null && row.hasResult ? (
        <span className="text-[14px] text-[#6B7280]">{tKit('noValue')}</span>
      ) : (
        <PhaseChip phase={row.phase === null ? null : acaraPhaseKey(row.phase.phase)} />
      )}
    </span>
  );
}
