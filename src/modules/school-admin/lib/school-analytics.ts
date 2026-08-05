import { format } from 'date-fns';

import {
  ACARA_PHASES,
  TEST_WINDOW_DATE_FORMAT,
} from '@/modules/school-admin/constants/analytics.constants';
import type { AcaraPhase } from '@/modules/school-admin/types/analytics.types';

// Display narrowing for the C-RPT-06 payload. Nothing is derived here — the
// endpoint owns every figure; these only decide whether a value can be
// rendered as a label or a date, so the caller falls back to the spec's empty
// value instead of printing a raw enum or an Invalid Date.

// `avg_reading_level` / `reading_progress` come back as the aggregate ACARA
// phase string. Narrowing against the contract list keeps a value written
// before the vocabulary settled off t(), where it would throw on a missing key.
export function toAcaraPhase(value: string | null): AcaraPhase | null {
  return ACARA_PHASES.find((phase) => phase === value) ?? null;
}

// `next_test_window` is the stored ISO-8601 instant so it lands in the reader's
// own timezone here rather than being sliced to a calendar date server-side.
export function formatTestWindow(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : format(date, TEST_WINDOW_DATE_FORMAT);
}
