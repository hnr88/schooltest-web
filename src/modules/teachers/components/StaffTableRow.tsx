'use client';

import { format } from 'date-fns';
import { useFormatter, useTranslations } from 'next-intl';

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
    <span className="block min-w-0 truncate" title={name}>
      <PersonCell
        name={name}
        secondary={
          row.expires_at
            ? t('expiresOn', { date: format(new Date(row.expires_at), 'd MMM yyyy') })
            : undefined
        }
      />
    </span>
  );
}

// The design's Classes column is a plain text count ("3 classes" / "No
// classes"); the class list itself lives on the detail screen. An invitation
// has no detail screen, so it names the classes already waiting on it
// (BUG-006), or reads like any teacher with none.
export function StaffClassesCell({ row }: { row: StaffRow }) {
  const t = useTranslations('Teachers.table');
  const format = useFormatter();

  if (row.kind === 'invitation' && row.classes.length > 0) {
    const text = t('classesWaiting', { classes: format.list(row.classes.map((klass) => klass.name)) });
    return (
      <span className="block min-w-0 truncate" title={text} data-slot="staff-invite-classes">
        {text}
      </span>
    );
  }
  if (row.classes.length === 0) {
    return <span>{t('classesNone')}</span>;
  }
  return <span>{t('classesCount', { count: row.classes.length })}</span>;
}
