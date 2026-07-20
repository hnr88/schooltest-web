import type { LucideIcon } from 'lucide-react';

import type {
  StudentWizardOutput,
  StudentWizardValues,
} from '@/modules/student-wizard/schemas/student-wizard.schema';

// Field enums — kept in lockstep with the `*_VALUES` tuples in the constants
// (single runtime source); declared here so props/types never import runtime.
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ContactChannel = 'whatsapp' | 'wechat' | 'email' | 'sms';
export type Term = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4';
export type CurrentYearLevel =
  | 'Prep'
  | 'Year 1'
  | 'Year 2'
  | 'Year 3'
  | 'Year 4'
  | 'Year 5'
  | 'Year 6'
  | 'Year 7'
  | 'Year 8'
  | 'Year 9'
  | 'Year 10'
  | 'Year 11'
  | 'Year 12';

export type WizardMode = 'create' | 'edit';
export type WizardStepKey = 'personal' | 'education' | 'guardian' | 'media' | 'review';

export interface ContactChannelOption {
  value: ContactChannel;
  icon: LucideIcon;
}

// Reused for both /dashboard/children/new (create) and the edit route (054):
// documentId + initialValues + mode are reserved for the edit wiring.
export interface WizardScreenProps {
  documentId?: string;
  initialValues?: Partial<StudentWizardValues>;
  mode?: WizardMode;
}

export type { StudentWizardValues, StudentWizardOutput };
