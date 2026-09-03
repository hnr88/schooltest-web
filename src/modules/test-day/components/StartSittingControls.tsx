'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

import type { StartSittingControlsProps } from '@/modules/test-day/types/components.types';

// Start-sitting button plus its error line, shared by the no-sitting empty
// state and the closed-sitting card. Extracted from TestDayScreen in task 136
// so the screen stays under the component line cap with the summary panel
// mounted; behaviour and copy keys are unchanged.
export function StartSittingControls({
  pending,
  disabled,
  error,
  onStart,
}: StartSittingControlsProps) {
  const t = useTranslations('TestDay');

  return (
    <>
      <Button
        type="button"
        className="min-h-11 w-fit px-4"
        loading={pending}
        disabled={disabled}
        onClick={onStart}
      >
        {t('startCta')}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('startError')}
        </p>
      ) : null}
    </>
  );
}
