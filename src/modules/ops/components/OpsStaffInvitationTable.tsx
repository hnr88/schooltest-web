'use client';

import { useTranslations } from 'next-intl';
import { staffInvitationHasUserAccount, staffRowId } from '@schooltest/ops-contracts';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusPill } from '@/modules/design-system';
import {
  staffInvitationAgeDays,
  staffInvitationInitial,
  staffInvitationTone,
} from '@/modules/ops/lib/ops-staff-invitations.helpers';

import type { OpsStaffInvitationTableProps } from '@/modules/ops/types/staff-invitations.types';

// C-OPS-PORTAL-016 rows. The reference row is avatar + title + subtitle + role +
// status pill; the subtitle is the invitation's own age ("Invited 3 days ago"),
// never its expiry. An accepted invitation is labelled as already having a staff
// account so the pictured tab never shows the same person twice, and the row key
// is the shared `invitation:<documentId>` identity — never a display name.
export function OpsStaffInvitationTable({ rows, nowMs }: OpsStaffInvitationTableProps) {
  const t = useTranslations('Ops.staffInvitations');

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card shadow-sm">
      <Table data-slot="ops-staff-invitations-table">
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnEmail')}</TableHead>
            <TableHead>{t('columnRole')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const days = staffInvitationAgeDays(row, nowMs);
            const rowId = staffRowId({ kind: 'invitation', documentId: row.documentId });
            return (
              <TableRow
                key={rowId}
                data-slot="ops-staff-invitation-row"
                data-row-id={rowId}
                data-status={row.status ?? 'unknown'}
                data-role={row.role ?? 'unknown'}
              >
                <TableCell className="align-top">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-9 flex-none place-items-center rounded-full bg-muted text-sm font-semibold text-secondary-foreground"
                    >
                      {staffInvitationInitial(row)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {row.display_name ?? t('noName')}
                      </span>
                      <span className="text-meta text-muted-foreground">
                        {days === null ? t('invitedUnknown') : t('invitedDaysAgo', { days })}
                      </span>
                      {staffInvitationHasUserAccount(row.status) ? (
                        <span className="text-meta text-muted-foreground">{t('acceptedNote')}</span>
                      ) : null}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="align-top">{row.email ?? t('noValue')}</TableCell>
                <TableCell className="align-top">
                  {row.role === null ? t('roleUnknown') : t(`role.${row.role}`)}
                </TableCell>
                <TableCell className="align-top">
                  <StatusPill tone={staffInvitationTone(row.status)}>
                    {row.status === null ? t('statusUnknown') : t(`status.${row.status}`)}
                  </StatusPill>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
