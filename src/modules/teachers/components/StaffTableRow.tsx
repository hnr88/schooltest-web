'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { PersonCell } from '@/modules/design-system';

import type { StaffRow } from '@/modules/teachers/types/teachers.types';

// ops/32 — the merged staff row's CELL content; the shared directory kit
// (`@/modules/directory`) owns the table shell, the row element and the action
// menu, and these two renderers are its column cells. The Name column is the
// design's identity cell (avatar + full name); an invitation additionally
// shows its expiry under the name. The row's status lives in its OWN pill
// column (design VIEW 4), so no badge rides in the identity cell.
export function StaffNameCell({ row }: { row: StaffRow }) {
  const t = useTranslations('Teachers.table');
  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;

  return (
    <PersonCell
      name={name}
      secondary={
        row.expires_at
          ? t('expiresOn', { date: format(new Date(row.expires_at), 'd MMM yyyy') })
          : undefined
      }
    />
  );
}

// The design's Classes column is a plain text count ("3 classes" / "No
// classes"); the class list itself lives on the detail screen.
export function StaffClassesCell({ row }: { row: StaffRow }) {
  const t = useTranslations('Teachers.table');

  if (row.kind === 'invitation') {
    return <span>{t('classesPending')}</span>;
  }
  if (row.classes.length === 0) {
    return <span>{t('classesNone')}</span>;
  }
  return <span>{t('classesCount', { count: row.classes.length })}</span>;
}
