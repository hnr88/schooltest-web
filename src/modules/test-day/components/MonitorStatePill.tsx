import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import type { MonitorRowState, SittingStudentState } from '@/modules/test-day/types/test-day.types';

import type { PillTone } from '@/modules/test-day/types/components.types';
import { STATE_TONES } from '@/modules/test-day/constants/components.constants';

// One status chip per monitor row. The five backend states render exactly as
// before; code_shown (C-SIT-05: the teacher revealed the code to this student
// and they have not joined yet) gets its own quiet treatment, a dashed
// outline on the neutral pill, so an expected wait never reads as a problem.
export function MonitorStatePill({ state }: { state: MonitorRowState }) {
  const t = useTranslations('TestDay.monitor');

  if (state === 'code_shown') {
    return (
      <StatusPill
        tone="neutral"
        className="border border-dashed border-border bg-transparent text-muted-foreground"
      >
        {t('state.code_shown')}
      </StatusPill>
    );
  }

  return <StatusPill tone={STATE_TONES[state]}>{t(`state.${state}`)}</StatusPill>;
}
