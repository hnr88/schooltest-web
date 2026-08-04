'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

import type { AbsentToggleProps } from '@/modules/test-day/types/components.types';

// C-SIT-06 (task 120, mvp-updates §4.5.6): per-row absent toggle. The pressed
// state mirrors the server flag on the monitor row; the mutation hook owns
// the request, the optimistic flip and the rollback. Dumb button; no state.
export function AbsentToggle({ studentName, absent, pending, onToggle }: AbsentToggleProps) {
  const t = useTranslations('TestDay.monitor');

  return (
    <Button
      type="button"
      variant={absent ? 'secondary' : 'outline'}
      size="sm"
      className="min-h-11 px-3"
      aria-pressed={absent}
      aria-label={t(absent ? 'clearAbsentLabel' : 'markAbsentLabel', { name: studentName })}
      loading={pending}
      onClick={() => onToggle(!absent)}
    >
      {t('absentLabel')}
    </Button>
  );
}
