'use client';

import { useTranslations } from 'next-intl';

import { ChildCard } from '@/modules/children/components/ChildCard';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildrenGridProps {
  rows: StudentListRow[];
}

export function ChildrenGrid({ rows }: ChildrenGridProps) {
  const t = useTranslations('Children');

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        {t('noMatches')}
      </p>
    );
  }

  return (
    <section aria-label={t('cardListLabel')} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <ChildCard key={row.documentId} student={row} />
      ))}
    </section>
  );
}
