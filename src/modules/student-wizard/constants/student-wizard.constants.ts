import { Mail, MessageCircle, MessageSquare, Smartphone } from 'lucide-react';
import type { DefaultValues } from 'react-hook-form';

import type {
  ContactChannelOption,
  StudentWizardValues,
} from '@/modules/student-wizard/types/student-wizard.types';

// Enum value tuples — the single source of truth the zod schema (`z.enum`) and
// the step widgets (049–052) both consume. C-STUDENT-CREATE / C-CT-STUDENT-EXT.
export const GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

export const CURRENT_YEAR_LEVEL_VALUES = [
  'Prep',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
] as const;

export const TERM_VALUES = ['Term 1', 'Term 2', 'Term 3', 'Term 4'] as const;

export const CONTACT_CHANNEL_VALUES = ['whatsapp', 'wechat', 'email', 'sms'] as const;

// schooltest testing-domain int field, kept optional in the parent whitelist.
export const YEAR_LEVEL_VALUES = [7, 8, 9, 10, 11, 12] as const;

// Target-entry-year Select options: currentYear..currentYear+6 (7 options). The
// schema's range refine uses currentYear..currentYear+10 (legacy TARGET_YEAR).
export const CURRENT_YEAR = new Date().getFullYear();
export const TARGET_ENTRY_YEARS = Array.from({ length: 7 }, (_, index) =>
  String(CURRENT_YEAR + index),
);
export const TARGET_YEAR_MIN = 2000;
export const TARGET_YEAR_MAX_OFFSET = 10;
export const DOB_MIN_YEAR = 1900;

// Media size gates (client-side pre-upload check; C-UPLOAD-PARENT / C-STUDENT-CREATE).
export const PHOTO_MAX_MB = 15;
export const VOICE_INTRO_MAX_MB = 10;
export const PHOTO_MAX_BYTES = PHOTO_MAX_MB * 1024 * 1024;
export const VOICE_INTRO_MAX_BYTES = VOICE_INTRO_MAX_MB * 1024 * 1024;

// How long the success panel holds before the wizard leaves for the roster — one
// beat past the 180ms pop-in, so the confirmation is read rather than glimpsed.
export const WIZARD_SUCCESS_DWELL_MS = 1100;

export const WIZARD_STEP_COUNT = 5;
export const WIZARD_STEP_KEYS = [
  'personal',
  'education',
  'guardian',
  'media',
  'review',
] as const;

// preferred_contact_channel selection-card icons (§5.12).
export const CONTACT_CHANNELS: readonly ContactChannelOption[] = [
  { value: 'whatsapp', icon: MessageCircle },
  { value: 'wechat', icon: MessageSquare },
  { value: 'email', icon: Mail },
  { value: 'sms', icon: Smartphone },
];

// RHF initial state — in-memory only (abandoning the route loses input, legacy
// parity). Empty strings for text inputs, null for the media/int placeholders.
export const WIZARD_DEFAULT_VALUES: DefaultValues<StudentWizardValues> = {
  given_name: '',
  family_name: '',
  email: '',
  date_of_birth: '',
  gender: undefined,
  nationality: '',
  passport_number: '',
  current_school: '',
  current_year_level: undefined,
  year_level: null,
  target_entry_year: '',
  target_entry_term: undefined,
  parent_guardian_name: '',
  parent_guardian_phone: '',
  parent_guardian_email: '',
  parent_guardian_wechat: '',
  preferred_contact_channel: 'whatsapp',
  photo: null,
  voice_intro: null,
};
