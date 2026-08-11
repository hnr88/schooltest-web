'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { PastSessionRow } from '@/modules/teacher/components/PastSessionRow';
import { findTestLabel } from '@/modules/teacher/lib/join-code';
import type { PastSessionsTableProps } from '@/modules/teacher/types/past-sessions.types';

// .qa/DESIGN.md §Test sessions (view 1): "Past sessions table — Class · Test ·
// Date · Completed". Real headers throughout: `scope="col"` on all four column
// heads and `scope="row"` on the class cell, so a screen reader announces every
// completion count against the class it belongs to.
//
// The rows arrive in C-TS-2's own `opened_at:desc` order and are rendered as
// sent — the portal does not sort, filter or page them, so a session generated
// on this page is the first row after a reload.
function PastSessionsTable({ sessions, tests }: PastSessionsTableProps) {
  const t = useTranslations('Teacher.testSessions.pastSessions');

  return (
    <Table data-slot="past-sessions-table" className="min-w-2xl">
      <TableCaption className="sr-only">{t('caption')}</TableCaption>
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow className="border-border">
          <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
            {t('class')}
          </TableHead>
          <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
            {t('test')}
          </TableHead>
          <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
            {t('date')}
          </TableHead>
          <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
            {t('completed')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <PastSessionRow
            key={session.sitting_document_id}
            session={session}
            testLabel={findTestLabel(tests, session.variant)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export { PastSessionsTable };
