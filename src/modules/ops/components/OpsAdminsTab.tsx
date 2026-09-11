'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { StaffUserRow } from '@schooltest/ops-contracts';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { statusOfDisposition, dispositionOfFailure } from '@/modules/ops/actions';
import { OpsStaffUsersTable } from '@/modules/ops/components/OpsStaffUsersTable';
import { useOwnershipTransferMutation } from '@/modules/ops/queries/use-staff-users.query';
import { restFailureOf } from '@/lib/axios/strapi';

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
 *
 * ops/12 (D-29): moved verbatim out of OpsSchoolTables.tsx so tasks 15-18 and
 * 25 own one tab file each.
 */
export function OpsAdminsTab({
  schoolDocumentId,
  ownerDocumentId,
  active,
  onInvite,
}: {
  schoolDocumentId: string;
  ownerDocumentId: string | null;
  active: boolean;
  onInvite: () => void;
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
        headerTitle={t('adminsHeaderTitle')}
        onInvite={onInvite}
        ownership={{
          ownerDocumentId,
          onMakeOwner: (row) => {
            transfer.reset();
            setTarget(row);
          },
          pendingDocumentId: transfer.isPending ? (target?.documentId ?? null) : null,
        }}
        // ops-tabs-audit — the design's header PRIMARY (`:363-367`, "Invite
        // admin") now rides the card's header row inside OpsStaffUsersTable
        // instead of floating above the table. `ops-admins-invite` is asserted
        // directly by `tests/e2e/ops-staff-invitation-ui.spec.ts` and
        // `tests/e2e/ops-session-expired.spec.ts` — the testid moves WITH the
        // button, so those specs keep their control.
        headerPrimary={
          <Button
            type="button"
            variant="navy"
            data-testid="ops-admins-invite"
            onClick={onInvite}
            className="h-10 rounded-[12px] px-[18px] text-[13.5px] font-semibold"
          >
            {t('inviteStaff')}
          </Button>
        }
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
