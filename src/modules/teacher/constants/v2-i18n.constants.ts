import type { AssessedBand, AttributeName, DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import type { RosterReleaseState } from '@/modules/results';
import type { ExpectedKind } from '@/modules/teacher/types/v2-family.types';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';

export const VIEW_MODEL_I18N_NAMESPACE = 'TeacherPortal.viewModel';

export const PHASE_LABEL_KEY: Readonly<Record<AcaraPhaseName, string>> = {
  Beginning: 'phase.beginning',
  Emerging: 'phase.emerging',
  Developing: 'phase.developing',
  Consolidating: 'phase.consolidating',
};

export const PHASE_SUB_LABEL_KEY: Readonly<Record<AcaraPhaseName, string>> = {
  Beginning: 'phaseSub.beginning',
  Emerging: 'phaseSub.emerging',
  Developing: 'phaseSub.developing',
  Consolidating: 'phaseSub.consolidating',
};

export const NOT_SAT_LABEL_KEY = 'phase.notSat';

export const SKILL_LABEL_KEY: Readonly<Record<DisplaySkill, string>> = {
  Decoding: 'skill.decoding',
  Vocabulary: 'skill.vocabulary',
  Grammar: 'skill.grammar',
  Gist: 'skill.gist',
  Detail: 'skill.detail',
  Inference: 'skill.inference',
  Critical: 'skill.critical',
};

export const SKILL_BLURB_KEY: Readonly<Record<DisplaySkill, string>> = {
  Decoding: 'skillBlurb.decoding',
  Vocabulary: 'skillBlurb.vocabulary',
  Grammar: 'skillBlurb.grammar',
  Gist: 'skillBlurb.gist',
  Detail: 'skillBlurb.detail',
  Inference: 'skillBlurb.inference',
  Critical: 'skillBlurb.critical',
};

export const ATTRIBUTE_LABEL_KEY: Readonly<Record<AttributeName, string>> = {
  Decoding: 'attribute.decoding',
  Vocab_A2: 'attribute.vocabA2',
  Grammar: 'attribute.grammar',
  Vocab_B1: 'attribute.vocabB1',
  Gist: 'attribute.gist',
  Detail: 'attribute.detail',
  Inference: 'attribute.inference',
};

export const NOT_YET_ASSESSED_GROUP = 'not_yet_assessed';

export const NOT_YET_ASSESSED_GROUP_KEY = 'attribute.notYetAssessed';

export const BAND_LABEL_KEY: Readonly<Record<AssessedBand, string>> = {
  secure: 'band.secure',
  developing: 'band.developing',
  emerging: 'band.emerging',
  not_yet: 'band.notYet',
};

export const GATE_LABEL_KEY: Readonly<Record<'passed' | 'notYet', string>> = {
  passed: 'gate.passed',
  notYet: 'gate.notYet',
};

export const EXPECTED_LABEL_KEY: Readonly<Record<ExpectedKind, string>> = {
  at: 'expected.at',
  approaching: 'expected.approaching',
  below: 'expected.below',
};

export const RELEASE_LABEL_KEY: Readonly<Record<RosterReleaseState, string>> = {
  held: 'release.label.held',
  released: 'release.label.released',
  recalled: 'release.label.recalled',
  manual: 'release.label.manual',
  absent: 'release.label.absent',
  nosit: 'release.label.nosit',
  open: 'release.label.open',
};

export const RELEASE_WHY_KEY: Readonly<Record<RosterReleaseState, string>> = {
  held: 'release.why.held',
  released: 'release.why.released',
  recalled: 'release.why.recalled',
  manual: 'release.why.manual',
  absent: 'release.why.absent',
  nosit: 'release.why.nosit',
  open: 'release.why.open',
};

export const RELEASED_UNDATED_WHY_KEY = 'release.why.releasedUndated';

/**
 * A HELD result with no `overall.domain_score` never says "Scored and ready": the row
 * reports what the result's own `status` says. `manual_scoring` reuses the hand-scoring
 * line; a `complete` run that produced no score knows nothing more, so it stays neutral
 * ("Not scored yet") — P1 parity row 6.
 */
export const HELD_UNSCORED_WHY_KEY: Readonly<Record<ResultView['status'], string>> = {
  scoring: 'release.why.heldScoring',
  partial_pending: 'release.why.heldScoring',
  manual_scoring: 'release.why.manual',
  scoring_failed: 'release.why.heldScoringFailed',
  complete: 'release.why.heldNoScore',
};

export const CARER_CAN_KEY: Readonly<Record<AttributeName, string>> = {
  Decoding: 'carer.can.decoding',
  Vocab_A2: 'carer.can.vocabA2',
  Grammar: 'carer.can.grammar',
  Vocab_B1: 'carer.can.vocabB1',
  Gist: 'carer.can.gist',
  Detail: 'carer.can.detail',
  Inference: 'carer.can.inference',
};

export const CARER_NEXT_KEY: Readonly<Record<AttributeName, string>> = {
  Decoding: 'carer.next.decoding',
  Vocab_A2: 'carer.next.vocabA2',
  Grammar: 'carer.next.grammar',
  Vocab_B1: 'carer.next.vocabB1',
  Gist: 'carer.next.gist',
  Detail: 'carer.next.detail',
  Inference: 'carer.next.inference',
};

export const CARER_SUMMARY_KEY = 'carer.summary';

export const CARER_EALD_NOTE_KEY = 'carer.ealdNote';

export const CLASS_FLAG_LABEL_KEY: Readonly<Record<'focus' | 'strength', string>> = {
  focus: 'flag.classFocus',
  strength: 'flag.classStrength',
};

export const STUDENT_TAG_LABEL_KEY: Readonly<Record<'focus' | 'strength', string>> = {
  focus: 'tag.focusArea',
  strength: 'tag.strength',
};

export const CHART_LABEL_KEY = {
  sitting: 'chart.sitting',
  classTip: 'chart.classTip',
  studentTip: 'chart.studentTip',
} as const;

export const GROWTH_STEADY_KEY = 'growth.steady';
