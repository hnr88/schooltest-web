import type {
  ACARA_PHASE_OPTIONS,
  DIAGNOSTIC_STATUS_OPTIONS,
  FIRST_LANGUAGE_OPTIONS,
} from '@/modules/school-students/constants/student-picklists.constants';

export type FirstLanguage = (typeof FIRST_LANGUAGE_OPTIONS)[number];

export type AcaraPhase = (typeof ACARA_PHASE_OPTIONS)[number];

export type DiagnosticStatus = (typeof DIAGNOSTIC_STATUS_OPTIONS)[number];
