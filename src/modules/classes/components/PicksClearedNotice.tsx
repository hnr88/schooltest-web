'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { PicksClearedNoticeProps } from '@/modules/classes/types/components.types';

// BUG-005 a11y: ticking an invited teacher unticks every other pick (and a
// teacher unticks an invited one). The live region is always mounted so the
// change is announced, and the same sentence stays visible for sighted users.
export function PicksClearedNotice({ dropped, labelOf }: PicksClearedNoticeProps) {
  const t = useTranslations('Classes.teacherPicker');
  const format = useFormatter();
  return (
    <p role="status" aria-live="polite" data-slot="teacher-picks-cleared" className="px-2 text-sm text-body empty:hidden">
      {dropped.length > 0
        ? t('picksCleared', { names: format.list(dropped.map(labelOf)), count: dropped.length })
        : null}
    </p>
  );
}
