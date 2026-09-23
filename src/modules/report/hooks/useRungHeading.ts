'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { acaraRungCode } from '@/modules/report/lib/acara-phase';

/**
 * A result's rung heading ("Consolidating English") in the active locale, built
 * from the stored phase CODE and the `Report.acaraPhases` words; `null` when the
 * stored phase is not a rung code, so the caller keeps its own fallback.
 */
export function useRungHeading(): (acaraPhase: string | null) => string | null {
  const t = useTranslations('Report');
  return useCallback(
    (acaraPhase: string | null) => {
      const rung = acaraRungCode(acaraPhase);
      return rung === null ? null : t('family.phaseHeading', { phase: t(`acaraPhases.${rung}`) });
    },
    [t],
  );
}
