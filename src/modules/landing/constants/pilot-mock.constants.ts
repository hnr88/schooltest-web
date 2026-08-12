/**
 * The client's own illustrative figures for the landing page's USP mocks, kept verbatim
 * from their draft (the "Kevin Chan" profile, the Term 1 -> Term 3 progress, the transition
 * pathway, the leader cohort strip).
 *
 * THESE ARE SAMPLE VALUES FOR A MARKETING MOCK, and every surface that renders them is
 * labelled as a sample in the DOM and to a screen reader. They are deliberately NOT wired
 * to any API, any student record or any Config row — the real product surfaces
 * (/dashboard/results and the C-TR-* endpoints) are where live numbers come from, and a
 * landing page must never imply a figure is a measurement when it is an illustration.
 *
 * Band words are the client's abbreviations (Cons. = consolidating, Dev. = developing,
 * Emg. = emerging, Beg. = beginning), not this platform's server-side mastery bands.
 */
import type { StatusPillTone } from '@/modules/design-system';

interface MockSubskill {
  readonly labelKey: string;
  readonly bandKey: string;
  readonly tone: StatusPillTone;
}

/** USP 01 — the seven reading subskills the draft lists on the profile card. */
const MOCK_PROFILE_SUBSKILLS: readonly MockSubskill[] = [
  { labelKey: 'pilot.mockSkillDecoding', bandKey: 'pilot.mockBandCons', tone: 'success' },
  { labelKey: 'pilot.mockSkillVocabulary', bandKey: 'pilot.mockBandBeg', tone: 'danger' },
  { labelKey: 'pilot.mockSkillGrammar', bandKey: 'pilot.mockBandDev', tone: 'warning' },
  { labelKey: 'pilot.mockSkillGist', bandKey: 'pilot.mockBandDev', tone: 'warning' },
  { labelKey: 'pilot.mockSkillDetail', bandKey: 'pilot.mockBandEmg', tone: 'warning' },
  { labelKey: 'pilot.mockSkillInference', bandKey: 'pilot.mockBandEmg', tone: 'warning' },
  { labelKey: 'pilot.mockSkillCritical', bandKey: 'pilot.mockBandBeg', tone: 'danger' },
];

/** USP 03 — per-subskill growth across the year, as the draft lists it. */
const MOCK_PROGRESS_DELTAS = [
  { labelKey: 'pilot.mockSkillDecoding', value: 17 },
  { labelKey: 'pilot.mockSkillVocabulary', value: 12 },
  { labelKey: 'pilot.mockSkillGrammar', value: 14 },
  { labelKey: 'pilot.mockSkillGist', value: 16 },
  { labelKey: 'pilot.mockSkillDetail', value: 11 },
  { labelKey: 'pilot.mockSkillInference', value: 11 },
  { labelKey: 'pilot.mockSkillCritical', value: 9 },
] as const;

/** USP 03 — the three reporting points the draft shows for the overall reading score. */
const MOCK_SCORE_TRAIL = [48, 57, 65] as const;

/** USP 04 — the draft's four transition stages, least to most autonomous. */
const MOCK_PATHWAY_STAGES = [
  'pilot.mockStageSupports',
  'pilot.mockStageHsp',
  'pilot.mockStageMainstream',
  'pilot.mockStageAutonomous',
] as const;

/** USP 04 — the four macro skills the pathway is judged across. */
const MOCK_PATHWAY_SKILLS = [
  'pilot.mockSkillListening',
  'pilot.mockSkillSpeaking',
  'pilot.mockSkillReading',
  'pilot.mockSkillWriting',
] as const;

/** USP 05, teacher view — the draft's three prioritised actions plus the one to skip. */
const MOCK_TEACHER_ACTIONS = [
  'pilot.mockActionOne',
  'pilot.mockActionTwo',
  'pilot.mockActionThree',
] as const;

/** USP 05, leader view — the draft's cohort strip. */
const MOCK_LEADER_STATS = [
  { valueKey: 'pilot.mockLeaderTrackedValue', labelKey: 'pilot.mockLeaderTrackedLabel' },
  { valueKey: 'pilot.mockLeaderGrowthValue', labelKey: 'pilot.mockLeaderGrowthLabel' },
  { valueKey: 'pilot.mockLeaderReadyValue', labelKey: 'pilot.mockLeaderReadyLabel' },
] as const;

export {
  MOCK_LEADER_STATS,
  MOCK_PATHWAY_SKILLS,
  MOCK_PATHWAY_STAGES,
  MOCK_PROFILE_SUBSKILLS,
  MOCK_PROGRESS_DELTAS,
  MOCK_SCORE_TRAIL,
  MOCK_TEACHER_ACTIONS,
};
export type { MockSubskill };
