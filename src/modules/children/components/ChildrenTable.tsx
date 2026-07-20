'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { ChildrenTableRow } from '@/modules/children/components/ChildrenTableRow';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildrenTableProps {
  rows: StudentListRow[];
}

// C-UI-MYCHILDREN table (§9): Student · Nationality · Year level · Target entry ·
// Status · Added · actions. Rounded bordered container; a filter that matches no
// rows shows a translated note instead of a blank body.
export function ChildrenTable({ rows }: ChildrenTableProps) {
  const t = useTranslations('Children');

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnStudent')}</TableHead>
            <TableHead>{t('columnNationality')}</TableHead>
            <TableHead>{t('columnYearLevel')}</TableHead>
            <TableHead>{t('columnTargetEntry')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
            <TableHead>{t('columnAdded')}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t('columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                {t('noMatches')}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => <ChildrenTableRow key={row.documentId} student={row} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
