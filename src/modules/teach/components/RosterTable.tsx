'use client';

import { useTranslations } from 'next-intl';

import {
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import type { RosterChild } from '@/modules/teach/types/roster.types';

function rosterDisplayName(row: RosterChild): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}

interface RosterTableProps {
  rows: RosterChild[];
}

// Teacher roster (task 63, mvp-updates §4.4): read-only name/status/email.
// A null email renders the "needed before test day" warning pill — the fix
// itself stays with the school administrator (C-CHD-03 is school_admin-only),
// so there is deliberately no inline edit here. Dumb renderer; fetching lives
// in useClassRosterQuery.
export function RosterTable({ rows }: RosterTableProps) {
  const t = useTranslations('Teach.roster');

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
            <TableHead>{t('columnEmail')}</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
