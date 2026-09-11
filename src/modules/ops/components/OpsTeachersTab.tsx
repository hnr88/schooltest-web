'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/modules/design-system';
import { DIRECTORY_PARAMS } from '@/modules/ops/directory';
import { OpsStaffUsersTable } from '@/modules/ops/components/OpsStaffUsersTable';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';

/**
 * The kit's page-global params, plus the surface-local `blocked` filter —
 * cleared on the way into the Classes tab so this deep link does not carry
 * the Teachers directory's own search/sort/page/status into a tab that has
 * none of those meanings (`logic.md#c-tabs` — the same clearing
 * `OpsSchoolTables.tsx#onTabChange` already does for an ordinary tab click).
 */
const CLASSES_SCOPED_PARAMS = [
  DIRECTORY_PARAMS.q,
  DIRECTORY_PARAMS.sort,
  DIRECTORY_PARAMS.page,
  DIRECTORY_PARAMS.layout,
  'blocked',
] as const;

/**
 * ops/12 (D-29): moved verbatim out of OpsSchoolTables.tsx so tasks 15-18 and
 * 25 own one tab file each.
 *
 * ops/16: opens the merged-directory chrome task 15 built for the Admins tab
 * (header, chips, row menu, bulk bar — gated in `OpsStaffUsersTable.tsx` on
 * `headerTitle !== undefined`) for Teachers too, and supplies the two pieces
 * that surface needs and Admins does not: a teacher-shaped header summary and
 * the "View classes" deep link into the Classes tab.
 */
export function OpsTeachersTab({
  schoolDocumentId,
  active,
  onManage,
  onInvite,
}: {
  schoolDocumentId: string;
  active: boolean;
  onManage: () => void;
  onInvite: () => void;
}) {
  const t = useTranslations('Ops.schoolTables');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Class membership stays with the staff directory that owns it; the accepted
  // accounts, their status and their real activity come from C-OPS-PORTAL-015.
  // Neither read invents the other's data. The query only runs while its own
  // tab is selected, so opening the page does not fetch four tabs' worth.
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, active);
  const teacherRows = teachers.data?.data ?? [];
  const classCounts = Object.fromEntries(
    teacherRows.map((teacher) => [teacher.documentId, teacher.classes.length]),
  );
  // "M classes covered" (design `:1330`) is the UNION of classes any teacher
  // on this read is attached to, not a sum of the per-row counts above — a
  // co-taught class must count once, the same de-duplication
  // `mergeTeacherClassRefs` already applies per row.
  const classesCovered = new Set(
    teacherRows.flatMap((teacher) => teacher.classes.map((klass) => klass.documentId)),
  ).size;
  const totalTeachers = teachers.data?.meta.pagination.total ?? teacherRows.length;

  const viewClasses = (teacherDocumentId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const param of CLASSES_SCOPED_PARAMS) params.delete(param);
    params.set('tab', 'classes');
    params.set('teacher', teacherDocumentId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('teachersNote')}</p>
      <OpsStaffUsersTable
        schoolDocumentId={schoolDocumentId}
        role="teacher"
        enabled={active}
        emptyTitle={t('teachersEmptyTitle')}
        emptyDescription={t('teachersEmptyDescription')}
        classCounts={classCounts}
        headerTitle={t('teachersHeaderTitle')}
        headerSummary={t('teachersHeaderSummary', { teachers: totalTeachers, classes: classesCovered })}
        onInvite={onInvite}
        onViewClasses={viewClasses}
        // ops-tabs-audit — design `:353-368`: the header row carries the card's
        // actions on the title's right. Manage teachers is the outline
        // secondary-shape control and Invite staff the navy primary; both move
        // ONTO the card header (OpsStaffUsersTable) instead of floating above
        // the table. `ops-teachers-invite` keeps its testid through the move.
        headerPrimary={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onManage}
              className="h-10 rounded-[12px] border-[#D8DFEA] px-4 text-[13.5px] font-semibold text-[#3D4A5C] hover:border-navy-900 hover:bg-transparent hover:text-navy-900"
            >
              {t('manageTeachers')}
            </Button>
            <Button
              type="button"
              variant="navy"
              data-testid="ops-teachers-invite"
              onClick={onInvite}
              className="h-10 rounded-[12px] px-[18px] text-[13.5px] font-semibold"
            >
              {t('inviteStaff')}
            </Button>
          </>
        }
      />
    </div>
  );
}
