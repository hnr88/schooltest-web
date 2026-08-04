import type { ChildProgressResult, StatusMeta } from '@/modules/children/types/children.types';
import type { Band, Readiness, Skill } from '@/modules/children/types/lib.types';
import type { SkillVerdictTone, StatusPillTone, SubjectProgressTone } from '@/modules/design-system';

export const READINESS_RANK: Record<Readiness, number> = {
  not_yet: 0,
  approaching: 1,
  met: 2,
  not_assessed: -1,
};

export const READINESS_VERDICTS: Record<Readiness, SkillVerdictTone> = {
  met: 'mastered',
  approaching: 'emerging',
  not_yet: 'notYet',
  not_assessed: 'notAssessed',
};

export const RESULT_STATUS_TONES: Record<ChildProgressResult['status'], StatusPillTone> = {
  scoring: 'warning',
  partial_pending: 'info',
  complete: 'success',
};

export const SKILL_TONES: Record<Skill, SubjectProgressTone> = {
  reading: 'primary',
  listening: 'accent',
  speaking: 'warning',
  writing: 'success',
};

export const CEFR_LADDER: readonly Band[] = ['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1'];

export const ASSESSABLE_SKILLS: Skill[] = ['reading', 'listening', 'speaking', 'writing'];

export const CEFR_LADDER_SIZE = CEFR_LADDER.length;

export const ROSTER_PAGE_SIZE = 25;

export const WINDOW = 1;

export const STATUS_TONES: Record<string, StatusPillTone> = {
  active: 'success',
  archived: 'neutral',
  enrolled: 'info',
};

export const STATUS_META: Record<string, StatusMeta> = {
  active: {
    labelKey: 'statusActive',
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  },
  archived: {
    labelKey: 'statusArchived',
    className: 'bg-muted text-foreground',
  },
  enrolled: {
    labelKey: 'statusEnrolled',
    className: 'bg-blue-50 text-navy-800 dark:bg-blue-950 dark:text-blue-300',
  },
};

export const FALLBACK_STATUS: StatusMeta = {
  labelKey: 'statusActive',
  className: 'bg-muted text-foreground',
};

export const NUMERIC_YEAR = /^(?:year\s*)?(\d{1,2})$/i;
