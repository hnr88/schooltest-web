'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { acaraPhaseText } from '@/modules/report/lib/acara-phase';

/** A stored ACARA phase in the active locale's words; `null` stays `null`. */
export function useAcaraPhaseText(): (value: string | null) => string | null {
  const t = useTranslations('Report');
  return useCallback(
    (value: string | null) => (value === null ? null : acaraPhaseText(value, (code) => t(`acaraPhases.${code}`))),
    [t],
  );
}
