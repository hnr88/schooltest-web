'use client';

import { useTranslations } from 'next-intl';

import {
  Button,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { useFlagEmailFixMutation } from '@/modules/teach/queries/use-flag-email-fix.mutation';
import type { RosterChild } from '@/modules/teach/types/roster.types';

import type { RosterTableProps } from '@/modules/teach/types/components.types';

function rosterDisplayName(row: RosterChild): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}

// Teacher roster (task 63, mvp-updates §4.4): name/status/email plus the
// C-CHD-05 email-fix action (task 102) that flags a wrong or missing email for
// the school administrator. The fix itself stays with the administrator
// (C-CHD-03 is school_admin-only), so there is deliberately no inline edit.
// Once flagged, the action swaps to a pending badge; task 106 closes the D-18
// gap so the badge comes from the server flag on the row (with the
// mutation-session state covering the moment before the invalidated roster
// query refetches). Fetching lives in useClassRosterQuery.
export function RosterTable({ rows }: RosterTableProps) {
  const t = useTranslations('Teach.roster');
  const { flagEmailFix, isFlagged, pendingDocumentId } = useFlagEmailFixMutation();

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
            <TableHead>{t('columnEmail')}</TableHead>
            <TableHead>{t('columnActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.documentId}>
              <TableCell className="font-medium">{rosterDisplayName(row)}</TableCell>
              <TableCell>
                <StatusPill tone={row.status === 'active' ? 'success' : 'neutral'}>
                  {row.status === 'active' ? t('statusActive') : t('statusArchived')}
                </StatusPill>
              </TableCell>
              <TableCell>
                {row.email ? (
                  row.email
                ) : (
                  <StatusPill tone="warning">{t('emailMissing')}</StatusPill>
                )}
              </TableCell>
              <TableCell>
                {row.email_fix_requested || isFlagged(row.documentId) ? (
                  <StatusPill tone="info">{t('emailFixPending')}</StatusPill>
                ) : (
                  <Button
                    data-slot="email-fix-action"
                    variant="outline"
                    size="sm"
                    disabled={pendingDocumentId === row.documentId}
                    onClick={() => flagEmailFix(row.documentId)}
                  >
                    {t('emailFixAction')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
