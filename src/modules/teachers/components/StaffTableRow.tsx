'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Badge, PersonCell, Tag } from '@/modules/design-system';

import type { StaffRow } from '@/modules/teachers/types/teachers.types';
import { STATUS_VARIANTS } from '@/modules/teachers/constants/components.constants';

// ops/32 — the merged staff row's CELL content. The bespoke <tr> is gone: the
// shared directory kit (`@/modules/directory`) owns the table shell, the row
// element and the action menu, and these two renderers are its column cells.
// The spec's Name column is avatar + full name, so an ACTIVE teacher — the
// only row the spec's table describes — renders exactly that. Rows the spec
// never contemplated (invited, expired, deactivated: the C-INV-02 merge) keep
// a badge in the identity cell, because without it a pending invitation is
// indistinguishable from a live account and the row's destructive actions
// differ. An invitation additionally shows its expiry under the name and is
// the only kind whose Classes cell says "assigned after joining".
export function StaffNameCell({ row }: { row: StaffRow }) {
  const t = useTranslations('Teachers.table');
  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;

  return (
    <div className="flex items-center gap-2">
      <PersonCell
        name={name}
        secondary={
          row.expires_at
            ? t('expiresOn', { date: format(new Date(row.expires_at), 'd MMM yyyy') })
            : undefined
        }
      />
      {row.status === 'active' ? null : (
        <Badge variant={STATUS_VARIANTS[row.status]}>{t(`status.${row.status}`)}</Badge>
      )}
    </div>
  );
}

export function StaffClassesCell({ row }: { row: StaffRow }) {
  const t = useTranslations('Teachers.table');

  if (row.kind === 'invitation') {
    return <span className="text-muted-foreground">{t('classesPending')}</span>;
  }
  if (row.classes.length === 0) {
    return <span className="text-muted-foreground">{t('noValue')}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {row.classes.map((klass) => (
        <Tag key={klass.documentId} label={klass.name} />
      ))}
    </span>
  );
}
