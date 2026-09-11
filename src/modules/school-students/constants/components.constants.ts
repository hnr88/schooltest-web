import type { AcaraPhase } from '@/modules/school-students/types/constants.types';

// School Admin Portal design (:1163-1169): the soft-tint pill pairs for the
// ACARA phases, and the lifecycle pairs from the drill-down's status pill
// (:1409). Foreground/background kept as a pair so a pill can never mix tones.
export interface PillTonePair {
  fg: string;
  bg: string;
}

export const ACARA_PHASE_PILL_TONES: Record<AcaraPhase, PillTonePair> = {
  beginning: { fg: '#92610B', bg: '#FDF3E0' },
  emerging: { fg: '#1D4ED8', bg: '#EEF3FE' },
  developing: { fg: '#0E7C66', bg: '#E1F5EF' },
  consolidating: { fg: '#0E2350', bg: '#E8ECF4' },
};

export const STUDENT_STATUS_PILL_TONES: Record<'active' | 'archived', PillTonePair> = {
  active: { fg: '#0E7C66', bg: '#E1F5EF' },
  archived: { fg: '#92610B', bg: '#FDF3E0' },
};

// The design's back link (VIEW 3, :451): 13.5/500 #7C8698, hover blue.
export const BACK_CLASSES =
  'w-fit text-[13.5px] font-medium text-[#7C8698] no-underline hover:text-blue-600';
