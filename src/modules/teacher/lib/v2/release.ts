import type { Readiness } from '@schooltest/scoring-contracts';

import type { RosterReleaseState } from '@/modules/results';

import { EXPECTED_LABEL_KEY, RELEASE_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { READINESS_EXPECTED, SCORED_RELEASE_KINDS } from '@/modules/teacher/constants/v2-thresholds.constants';
import { EXPECTED_TONE, RELEASE_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import type { ExpectedView, ReleaseActions, ReleaseStatusView } from '@/modules/teacher/types/v2-family.types';

export function expectedView(readiness: Readiness | null): ExpectedView | null {
  const kind = readiness === null ? undefined : READINESS_EXPECTED[readiness];
  return kind === undefined ? null : { kind, labelKey: EXPECTED_LABEL_KEY[kind], tone: EXPECTED_TONE[kind] };
}

export function releaseStatus(kind: RosterReleaseState): ReleaseStatusView {
  return { kind, labelKey: RELEASE_LABEL_KEY[kind], tone: RELEASE_TONE[kind] };
}

export function releaseActions(kind: RosterReleaseState): ReleaseActions {
  const scored = SCORED_RELEASE_KINDS.includes(kind);
  return { preview: scored, release: scored && kind !== 'released', recall: kind === 'released' };
}
