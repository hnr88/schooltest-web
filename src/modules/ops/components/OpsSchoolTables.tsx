'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import type { StaffUserRow } from '@schooltest/ops-contracts';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  KeyValueList,
  KeyValueRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/modules/design-system';
import { dispositionOfFailure, statusOfDisposition } from '@/modules/ops/actions';
import { DIRECTORY_PARAMS } from '@/modules/ops/directory';
import { OpsClassesTab } from '@/modules/ops/components/OpsClassesTab';
import { OpsSchoolActivity } from '@/modules/ops/components/OpsSchoolActivity';
import { OpsStaffUsersTable } from '@/modules/ops/components/OpsStaffUsersTable';
import { OpsStudentsTab } from '@/modules/ops/components/OpsStudentsTab';
import { OpsTeachersDialog } from '@/modules/ops/components/OpsTeachersDialog';
import { useOwnershipTransferMutation } from '@/modules/ops/queries/use-staff-users.query';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { restFailureOf } from '@/lib/axios/strapi';

import type { OpsSchoolTablesProps } from '@/modules/ops/types/components.types';

/**
 * The five pictured tabs — Overview, Admins, Teachers, Classes, Students.
 *
 * FIVE, not six: Results is deliberately absent. The reference draws five and
 * the visual-reference spec asserts it, so Results is reached from the
 * test-count summary instead of a tab of its own.
 */
const TAB_ORDER = ['overview', 'admins', 'teachers', 'classes', 'students'] as const;
type Tab = (typeof TAB_ORDER)[number];

const TAB_PARAM = 'tab';

/** The directory kit's page-global URL params, reset whenever the tab changes. */
const DIRECTORY_SCOPED_PARAMS = [
  DIRECTORY_PARAMS.q,
  DIRECTORY_PARAMS.sort,
  DIRECTORY_PARAMS.page,
  'blocked',
] as const;

function isTab(value: string | null): value is Tab {
  return value !== null && (TAB_ORDER as readonly string[]).includes(value);
}

/**
 * Ops school detail — the tabbed screens.
 *
 * Built on the design-system `Tabs` primitive (Radix underneath) rather than
 * the hand-rolled tablist this replaced. That is not a cosmetic swap: the
 * previous markup carried `role="tab"` and `aria-selected` but had no
 * arrow-key navigation, no roving focus and no `aria-controls`, so it
 * announced itself as a tablist while behaving like a row of buttons. Radix
 * supplies all three, and `@/components/ui/tabs` stays unedited (CLAUDE.md
 * law 11) because the design system already re-exports it.
 *
 * The selected tab lives in the URL, so a tab is linkable and survives a
 * reload. The whole block is keyed by school: moving to another school
 * remounts it, which resets the tab AND discards the previous school's panel
 * state — a stale roster appearing under a new school is the defect that
 * matters here, and unmounting is what makes it impossible rather than
 * unlikely.
 */
export function OpsSchoolTables({ schoolDocumentId, school }: OpsSchoolTablesProps) {
  const t = useTranslations('Ops.schoolTables');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [teachersOpen, setTeachersOpen] = useState(false);

  const raw = searchParams.get(TAB_PARAM);
  // An unknown ?tab= falls back to the first tab rather than rendering nothing:
  // a hand-edited or stale URL must not leave the page blank.
  const tab: Tab = isTab(raw) ? raw : 'overview';

  const onTabChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'overview') params.delete(TAB_PARAM);
      else params.set(TAB_PARAM, next);
      // Each tab is its own directory, and the kit's URL params are page-global
      // (`q`, `sort`, `page` are fixed names with no namespace). Carrying them
      // across a tab switch would ask the Teachers directory for the Admins
      // page 3 the operator was on — an empty table that looks like "no
      // teachers". Clearing them here, in the handler that changes the tab, is
      // the one place that knows the directory scope just changed.
      for (const param of DIRECTORY_SCOPED_PARAMS) params.delete(param);
      const query = params.toString();
      router.replace(query === '' ? pathname : `${pathname}?${query}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <Tabs
      key={schoolDocumentId}
      value={tab}
      onValueChange={onTabChange}
      className="flex flex-col gap-4"
    >
      <TabsList aria-label={t('title')} className="overflow-x-auto">
        {TAB_ORDER.map((key) => (
          <TabsTrigger key={key} value={key}>
            {t(`tab.${key}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Each panel owns its own loading, error and empty state: every tab body
          below is a component with its own query, so one tab failing never
          blanks another. */}
      <TabsContent value="overview">
        <div className="flex flex-col gap-4">
          <KeyValueList>
            <KeyValueRow label={t('fieldSuburb')}>{school.suburb ?? t('unknown')}</KeyValueRow>
            <KeyValueRow label={t('fieldState')}>{school.state ?? t('unknown')}</KeyValueRow>
            <KeyValueRow label={t('fieldSector')}>{school.sector ?? t('unknown')}</KeyValueRow>
            <KeyValueRow label={t('fieldContact')}>{school.contact_name ?? t('unknown')}</KeyValueRow>
            <KeyValueRow label={t('fieldEmail')}>{school.contact_email ?? t('unknown')}</KeyValueRow>
            {/* Unknown phone and last activity are NULL, shown as "unavailable"
                — never a placeholder that reads like a real value. */}
            <KeyValueRow label={t('fieldPhone')}>{school.phone ?? t('unknown')}</KeyValueRow>
            <KeyValueRow label={t('fieldLastActivity')}>
              {school.last_active_at ?? t('unknown')}
            </KeyValueRow>
          </KeyValueList>
          <OpsSchoolActivity documentId={schoolDocumentId} />
        </div>
      </TabsContent>

      <TabsContent value="admins">
        <AdminsTab
          schoolDocumentId={schoolDocumentId}
          ownerDocumentId={school.owner_documentId}
          active={tab === 'admins'}
        />
      </TabsContent>

      <TabsContent value="teachers">
        <TeachersTab
          schoolDocumentId={schoolDocumentId}
          active={tab === 'teachers'}
          onManage={() => setTeachersOpen(true)}
        />
      </TabsContent>

      <TabsContent value="classes">
        <OpsClassesTab schoolDocumentId={schoolDocumentId} />
      </TabsContent>

      <TabsContent value="students">
        <OpsStudentsTab schoolDocumentId={schoolDocumentId} />
      </TabsContent>

      <OpsTeachersDialog
        schoolDocumentId={schoolDocumentId}
        open={teachersOpen}
        onOpenChange={setTeachersOpen}
      />
    </Tabs>
  );
}

/**
 * C-OPS-PORTAL-027 (task 17) — the admins directory plus the Make owner action.
 *
 * The confirm carries the owner the operator SAW (`ownerDocumentId`, straight
 * off the school detail) as `expected_owner_documentId`. It is never re-read
 * just before sending: a value fetched to satisfy the guard would defeat it,
 * and the whole point is that a concurrent transfer 409s instead of silently
 * winning. A 409 is therefore not an error to apologise for — it means the
 * page is stale, so the message says to refresh rather than to retry.
 *
 * A school whose `owner_documentId` is null is the ambiguous LEGACY case D-OWN
 * describes: the backfill named an owner only where there was exactly one
 * active admin, and left the rest null on purpose. The banner says so and asks
 * ops to choose, because picking the first admin by sort order — or the primary
 * contact — is precisely the guess the decision forbids.
 */
function AdminsTab({
  schoolDocumentId,
  ownerDocumentId,
  active,
}: {
  schoolDocumentId: string;
  ownerDocumentId: string | null;
  active: boolean;
}) {
  const t = useTranslations('Ops.schoolTables');
  const [target, setTarget] = useState<StaffUserRow | null>(null);
  const transfer = useOwnershipTransferMutation();

  const status = statusOfDisposition(dispositionOfFailure(restFailureOf(transfer.error)));
  const errorMessage =
    transfer.error === null ? null : status === 409 ? t('ownerConflict') : t('ownerNotEligible');

  const confirm = () => {
    if (target === null) return;
    transfer.mutate(
      {
        schoolDocumentId,
        ownerDocumentId: target.documentId,
        expectedOwnerDocumentId: ownerDocumentId,
      },
      { onSuccess: () => setTarget(null) },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('adminsNote')}</p>
      {ownerDocumentId === null ? (
        <Alert variant="warning" title={t('ownerNone')}>
          {t('ownerNoneDescription')}
        </Alert>
      ) : null}
      {errorMessage === null ? null : (
        <Alert variant="error" title={t('errorTitle')}>
          {errorMessage}
        </Alert>
      )}
      <OpsStaffUsersTable
        schoolDocumentId={schoolDocumentId}
        role="school_admin"
        enabled={active}
        emptyTitle={t('adminsEmptyTitle')}
        emptyDescription={t('adminsEmptyDescription')}
        ownership={{
          ownerDocumentId,
          onMakeOwner: (row) => {
            transfer.reset();
            setTarget(row);
          },
          pendingDocumentId: transfer.isPending ? (target?.documentId ?? null) : null,
        }}
      />

      <Dialog open={target !== null} onOpenChange={(open) => (open ? null : setTarget(null))}>
        <DialogContent data-slot="ops-make-owner-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('makeOwnerConfirmTitle', {
                name: target?.display_name ?? target?.email ?? '',
              })}
            </DialogTitle>
            <DialogDescription>{t('makeOwnerConfirmBody')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTarget(null)}>
              {t('makeOwnerCancel')}
            </Button>
            <Button type="button" onClick={confirm} disabled={transfer.isPending}>
              {t('makeOwnerConfirmAction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeachersTab({
  schoolDocumentId,
  active,
  onManage,
}: {
  schoolDocumentId: string;
  active: boolean;
  onManage: () => void;
}) {
  const t = useTranslations('Ops.schoolTables');
  // Class membership stays with the staff directory that owns it; the accepted
  // accounts, their status and their real activity come from C-OPS-PORTAL-015.
  // Neither read invents the other's data. The query only runs while its own
  // tab is selected, so opening the page does not fetch four tabs' worth.
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, active);
  const classCounts = Object.fromEntries(
    (teachers.data?.data ?? []).map((teacher) => [teacher.documentId, teacher.classes.length]),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('teachersNote')}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onManage}>
          {t('manageTeachers')}
        </Button>
      </div>
      <OpsStaffUsersTable
        schoolDocumentId={schoolDocumentId}
        role="teacher"
        enabled={active}
        emptyTitle={t('teachersEmptyTitle')}
        emptyDescription={t('teachersEmptyDescription')}
        classCounts={classCounts}
      />
    </div>
  );
}
